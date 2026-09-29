import { describe, expect, test } from "vitest";
import { castVote, createPoll, getPoll, hasParticipated, listPollsForAdmin } from "../lib/polls";
import { addVoters, listRoster } from "../lib/roster";
import { trackTestData } from "./test-data";

const data = trackTestData();

/** 기준 시각을 한국 시간 입력 칸 형식(YYYY-MM-DDTHH:mm:ss)으로 적는다. */
function kst(date: Date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

async function voterNamed(label: string) {
  const name = data.name(label);
  const added = await addVoters(name);
  if (!added.ok) throw new Error(added.error);
  return (await listRoster()).find((v) => v.name === name)!;
}

/** 지금부터 seconds초 뒤에 마감되는 투표를 만든다. */
async function pollClosingIn(seconds: number) {
  const closesAt = new Date(Date.now() + seconds * 1000);
  const result = await createPoll(data.title("곧마감"), ["피자", "치킨"], kst(closesAt));
  if (!result.ok) throw new Error(result.error);
  return { poll: (await getPoll(result.pollId))!, closesAt };
}

async function waitUntilPast(time: Date) {
  const ms = time.getTime() - Date.now() + 500;
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

describe("운영자가 마감 시각을 정한다", () => {
  test("한국 시간으로 입력한 마감 시각이 그 시점으로 저장되고, 아직은 진행 중이다", async () => {
    const result = await createPoll(data.title("MT"), ["가평", "양평"], "2099-10-03T18:00");
    if (!result.ok) throw new Error(result.error);

    const poll = await getPoll(result.pollId);

    expect(poll?.closesAt?.toISOString()).toBe("2099-10-03T09:00:00.000Z");
    expect(poll?.isClosed).toBe(false);
  });

  test("마감 전에는 투표할 수 있고, 마감 뒤에는 거부되며 결과와 참여 기록이 그대로다", async () => {
    const [early, late] = [await voterNamed("일찍"), await voterNamed("늦게")];
    const { poll, closesAt } = await pollClosingIn(3);
    const [pizza, chicken] = poll.options;

    expect(await castVote(poll.id, pizza.id, early.id)).toBe("ok");
    await waitUntilPast(closesAt);

    expect(await castVote(poll.id, chicken.id, late.id)).toBe("closed");
    const after = await getPoll(poll.id);
    expect(after?.isClosed).toBe(true);
    expect(after?.options.map((o) => o.voteCount)).toEqual([1, 0]);
    expect(await hasParticipated(poll.id, late.id)).toBe(false);
  });

  test("마감 시각을 비우면 마감 없는 투표가 된다", async () => {
    const result = await createPoll(data.title("무기한"), ["가", "나"], "  ");
    if (!result.ok) throw new Error(result.error);

    const poll = await getPoll(result.pollId);

    expect(poll?.closesAt).toBeNull();
    expect(poll?.isClosed).toBe(false);
  });

  test.each([
    ["지금 이전 시각", () => kst(new Date(Date.now() - 60 * 1000))],
    ["날짜 형식이 아님", () => "내일 저녁"],
    ["없는 날짜", () => "2099-02-30T18:00"],
    ["달이나 시각이 범위를 벗어남", () => "2099-13-01T25:00"],
  ])("마감 시각이 %s이면 만들지 않고 오류 문구를 돌려준다", async (_case, rawClosesAt) => {
    const title = data.title("거부");

    const result = await createPoll(title, ["가", "나"], rawClosesAt());

    expect(result).toEqual({ ok: false, error: expect.stringMatching(/\S/) });
    expect((await listPollsForAdmin()).some((p) => p.title === title)).toBe(false);
  });

  test("이미 참여한 투표자가 마감 뒤에 다시 투표하면 이미 참여했다고 답한다", async () => {
    const voter = await voterNamed("다시");
    const { poll, closesAt } = await pollClosingIn(2);
    await castVote(poll.id, poll.options[0].id, voter.id);
    await waitUntilPast(closesAt);

    expect(await castVote(poll.id, poll.options[1].id, voter.id)).toBe("already");
  });
});
