import { describe, expect, test } from "vitest";
import { createPoll, listPollsFor, listPollsForAdmin } from "../lib/polls";
import { addVoters, listRoster } from "../lib/roster";
import { kst } from "./kst";
import { trackTestData } from "./test-data";

const data = trackTestData();

async function created(label: string, closesAt: Date | null) {
  const result = await createPoll(data.title(label), ["가", "나"], closesAt ? kst(closesAt) : "");
  if (!result.ok) throw new Error(result.error);
  return result.pollId;
}

describe("투표 목록의 순서", () => {
  test("마감이 가까운 진행 중 투표 → 마감 없는 투표(최신순) → 마감된 투표(최근에 마감된 순)", async () => {
    const name = data.name("순서");
    await addVoters(name);
    const voter = (await listRoster()).find((v) => v.name === name)!;

    // 만드는 순서를 기대 순서와 엇갈리게 해서, 최신순만으로는 이 순서가 나오지 않게 한다.
    // 마감될 투표 두 개를 먼저 만들어 두고(여유 8초), 나머지를 만든 뒤 마감을 기다린다.
    const base = Date.now() + 8_000;
    const closedLater = await created("나중마감", new Date(base + 1000));
    const closedFirst = await created("먼저마감", new Date(base));
    const closesIn1h = await created("한시간", new Date(Date.now() + 3600_000));
    const noDeadlineOld = await created("무기한옛날", null);
    const closesIn2h = await created("두시간", new Date(Date.now() + 2 * 3600_000));
    const noDeadlineNew = await created("무기한최근", null);
    await new Promise((r) => setTimeout(r, Math.max(0, base + 1500 - Date.now())));

    const expected = [closesIn1h, closesIn2h, noDeadlineNew, noDeadlineOld, closedLater, closedFirst];
    const ours = (list: { id: string }[]) => list.map((p) => p.id).filter((id) => expected.includes(id));

    expect(ours(await listPollsFor(voter.id))).toEqual(expected);
    expect(ours(await listPollsForAdmin())).toEqual(expected);
  }, 40_000);
});
