import { describe, expect, test } from "vitest";
import { createPoll, listPollsFor, listPollsForAdmin } from "../lib/polls";
import { addVoters, listRoster } from "../lib/roster";
import { trackTestData } from "./test-data";

const data = trackTestData();

/** 기준 시각을 한국 시간 입력 칸 형식(YYYY-MM-DDTHH:mm:ss)으로 적는다. */
function kst(date: Date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

const inSeconds = (s: number) => new Date(Date.now() + s * 1000);

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

    const closingSoonest = new Date(Date.now() + 8000);
    const ids = {
      noDeadlineOld: await created("무기한옛날", null),
      closesIn2h: await created("두시간", inSeconds(2 * 3600)),
      closedFirst: await created("먼저마감", closingSoonest),
      closesIn1h: await created("한시간", inSeconds(3600)),
      closedLater: await created("나중마감", new Date(closingSoonest.getTime() + 1000)),
      noDeadlineNew: await created("무기한최근", null),
    };
    await new Promise((r) => setTimeout(r, closingSoonest.getTime() + 1500 - Date.now()));

    const expected = [
      ids.closesIn1h,
      ids.closesIn2h,
      ids.noDeadlineNew,
      ids.noDeadlineOld,
      ids.closedLater,
      ids.closedFirst,
    ];
    const ours = (list: { id: string }[]) =>
      list.map((p) => p.id).filter((id) => expected.includes(id));

    expect(ours(await listPollsFor(voter.id))).toEqual(expected);
    expect(ours(await listPollsForAdmin())).toEqual(expected);
  });
});
