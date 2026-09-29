import { describe, expect, test } from "vitest";
import { sql } from "../lib/db";
import {
  castVote,
  createPoll,
  getPoll,
  getParticipationStatus,
  hasParticipated,
  listPollsFor,
} from "../lib/polls";
import { addVoters, listRoster, removeVoter } from "../lib/roster";
import { trackTestData } from "./test-data";

const data = trackTestData();

/** 이름 목록으로 투표자를 등록하고, 선택지 [피자, 치킨]인 투표를 하나 만든다. */
async function setup(...labels: string[]) {
  const names = labels.map((l) => data.name(l));
  const added = await addVoters(names.join("\n"));
  if (!added.ok) throw new Error(added.error);
  const roster = await listRoster();
  const voters = names.map((n) => roster.find((v) => v.name === n)!);
  const created = await createPoll(data.title("점심"), ["피자", "치킨"]);
  if (!created.ok) throw new Error(created.error);
  const poll = (await getPoll(created.pollId))!;
  const [pizza, chicken] = poll.options;
  return { voters, pollId: poll.id, pizza, chicken };
}

async function counts(pollId: string) {
  return (await getPoll(pollId))!.options.map((o) => o.voteCount);
}

describe("투표자가 투표하고 결과를 본다", () => {
  test("투표하면 그 선택지의 표가 1 늘고 목록에 투표 완료로 표시된다", async () => {
    const { voters: [a], pollId, pizza } = await setup("철수");

    expect(await castVote(pollId, pizza.id, a.id)).toBe("ok");

    expect(await counts(pollId)).toEqual([1, 0]);
    expect(await hasParticipated(pollId, a.id)).toBe(true);
    expect((await listPollsFor(a.id)).find((p) => p.id === pollId)?.participated).toBe(true);
  });

  test("같은 투표자의 두 번째 투표는 거부되고 표는 그대로다", async () => {
    const { voters: [a], pollId, pizza, chicken } = await setup("철수");
    await castVote(pollId, pizza.id, a.id);

    expect(await castVote(pollId, chicken.id, a.id)).toBe("already");

    expect(await counts(pollId)).toEqual([1, 0]);
  });

  test("같은 투표자가 동시에 두 번 투표해도 정확히 한 번만 반영된다", async () => {
    const { voters: [a], pollId, pizza, chicken } = await setup("철수");

    const results = await Promise.all([
      castVote(pollId, pizza.id, a.id),
      castVote(pollId, chicken.id, a.id),
    ]);

    expect(results.sort()).toEqual(["already", "ok"]);
    expect((await counts(pollId)).reduce((x, y) => x + y)).toBe(1);
  });

  test("다른 투표의 선택지로 투표하면 거부되고 참여 기록도 남지 않는다", async () => {
    const { voters: [a], pollId } = await setup("철수");
    const other = await setup("영희");

    expect(await castVote(pollId, other.pizza.id, a.id)).toBe("gone");

    expect(await hasParticipated(pollId, a.id)).toBe(false);
    expect(await counts(other.pollId)).toEqual([0, 0]);
  });

  test("없는 투표나 잘못된 형식의 ID에는 오류 없이 없음으로 답한다", async () => {
    const { voters: [a], pollId, pizza } = await setup("철수");

    expect(await castVote("not-a-uuid", pizza.id, a.id)).toBe("gone");
    expect(await castVote(pollId, "not-a-uuid", a.id)).toBe("gone");
    expect(await castVote(crypto.randomUUID(), pizza.id, a.id)).toBe("gone");
    expect(await getPoll("not-a-uuid")).toBeNull();
    expect(await hasParticipated("not-a-uuid", a.id)).toBe(false);
    expect(await hasParticipated(pollId, "not-a-uuid")).toBe(false);
    expect(await getParticipationStatus("not-a-uuid")).toEqual({ participated: [], notYet: [] });
    expect(await listPollsFor("not-a-uuid")).toEqual(expect.any(Array));
  });

  test("여러 명이 투표하면 표 합계와 참여 수가 같고, 참여 현황은 이름순이다", async () => {
    const { voters: [c, a, b, d], pollId, pizza, chicken } = await setup("다", "가", "나", "라");
    await castVote(pollId, chicken.id, c.id);
    await castVote(pollId, pizza.id, a.id);
    await castVote(pollId, chicken.id, b.id);

    expect(await counts(pollId)).toEqual([1, 2]);
    const status = await getParticipationStatus(pollId);
    expect(status.participated).toEqual([a.name, b.name, c.name]);
    const ours = [a, b, c, d].map((v) => v.name);
    expect(status.notYet.filter((n) => ours.includes(n))).toEqual([d.name]);
  });

  test("명부에서 뺀 투표자의 참여 기록과 표는 결과에 남는다", async () => {
    const { voters: [a], pollId, pizza } = await setup("철수");
    await castVote(pollId, pizza.id, a.id);

    await removeVoter(a.id);

    expect(await counts(pollId)).toEqual([1, 0]);
    expect((await getParticipationStatus(pollId)).participated).toContain(a.name);
  });

  test("비밀 투표: 투표자와 선택지를 함께 가리키는 테이블이나 열이 없다", async () => {
    // 스펙이 허용한 유일한 스키마 수준 테스트 (결정 기록 0002).
    const rows = await sql`
      select tc.table_name, ccu.table_name as references_table
      from information_schema.table_constraints tc
      join information_schema.constraint_column_usage ccu
        on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
      where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`;
    const referencesByTable = new Map<string, Set<string>>();
    for (const r of rows) {
      const set = referencesByTable.get(r.table_name) ?? new Set<string>();
      set.add(r.references_table);
      referencesByTable.set(r.table_name, set);
    }

    for (const [table, refs] of referencesByTable) {
      expect(refs.has("voters") && refs.has("options"), `${table}이 투표자와 선택지를 함께 가리킴`).toBe(false);
    }
    const voterColumns = await sql`
      select table_name from information_schema.columns
      where table_schema = 'public' and column_name in ('voter_id', 'option_id')
      group by table_name having count(distinct column_name) = 2`;
    expect(voterColumns).toEqual([]);
  });
});
