import { describe, expect, test } from "vitest";
import { castVote, createPoll, getPoll, hasParticipated, listPollsFor, listPollsForAdmin } from "../lib/polls";
import { addVoters, listRoster } from "../lib/roster";
import { CLOSING_TIME_MALFORMED, CLOSING_TIME_PAST } from "../lib/rules";
import { kst } from "./kst";
import { trackTestData } from "./test-data";

const data = trackTestData();


async function voterNamed(label: string) {
  const name = data.name(label);
  const added = await addVoters(name);
  if (!added.ok) throw new Error(added.error);
  return (await listRoster()).find((v) => v.name === name)!;
}

/**
 * 마감 전에 투표해야 하는 테스트가 쓰는 여유. 투표를 만든 뒤 첫 투표까지 DB 왕복이 몇 번 있어서,
 * 너무 짧으면 첫 투표 전에 이미 마감되어 테스트가 가끔 실패한다.
 */
const VOTE_BEFORE_CLOSE_SECONDS = 5;

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
    const { poll, closesAt } = await pollClosingIn(VOTE_BEFORE_CLOSE_SECONDS);
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
    ["지금 이전 시각", () => kst(new Date(Date.now() - 60 * 1000)), CLOSING_TIME_PAST],
    ["날짜 형식이 아님", () => "내일 저녁", CLOSING_TIME_MALFORMED],
    ["없는 날짜", () => "2099-02-30T18:00", CLOSING_TIME_MALFORMED],
    ["없는 달", () => "2099-13-01T18:00", CLOSING_TIME_MALFORMED],
    ["없는 시각", () => "2099-10-03T25:00", CLOSING_TIME_MALFORMED],
  ])("마감 시각이 %s이면 만들지 않고 알맞은 오류 문구를 돌려준다", async (_case, rawClosesAt, error) => {
    const title = data.title("거부");

    const result = await createPoll(title, ["가", "나"], rawClosesAt());

    expect(result).toEqual({ ok: false, error });
    expect((await listPollsForAdmin()).some((p) => p.title === title)).toBe(false);
  });

  test("이미 참여한 투표자가 마감 뒤에 다시 투표하면 이미 참여했다고 답한다", async () => {
    const voter = await voterNamed("다시");
    const { poll, closesAt } = await pollClosingIn(VOTE_BEFORE_CLOSE_SECONDS);
    expect(await castVote(poll.id, poll.options[0].id, voter.id)).toBe("ok");
    await waitUntilPast(closesAt);

    expect(await castVote(poll.id, poll.options[1].id, voter.id)).toBe("already");
  });

  test("투표자 목록과 운영자 목록도 마감 시각과 마감 여부를 알려준다", async () => {
    const voter = await voterNamed("목록");
    const { poll, closesAt } = await pollClosingIn(2);
    const later = await createPoll(data.title("나중"), ["가", "나"], "2099-10-03T18:00");
    if (!later.ok) throw new Error(later.error);
    await waitUntilPast(closesAt);

    const pick = <T extends { id: string }>(items: T[]) =>
      [poll.id, later.pollId].map((id) => items.find((p) => p.id === id)!);
    const expected = [
      [poll.closesAt?.toISOString(), true],
      ["2099-10-03T09:00:00.000Z", false],
    ];

    const forVoter = pick(await listPollsFor(voter.id));
    const forAdmin = pick(await listPollsForAdmin());

    expect(forVoter.map((p) => [p.closesAt?.toISOString(), p.isClosed])).toEqual(expected);
    expect(forAdmin.map((p) => [p.closesAt?.toISOString(), p.isClosed])).toEqual(expected);
  });

  test("마감된 투표에 다른 투표의 선택지로 투표하면 마감이 아니라 없음으로 답한다", async () => {
    const voter = await voterNamed("엉뚱");
    const { poll, closesAt } = await pollClosingIn(2);
    const other = await createPoll(data.title("다른"), ["가", "나"]);
    if (!other.ok) throw new Error(other.error);
    const otherOption = (await getPoll(other.pollId))!.options[0];
    await waitUntilPast(closesAt);

    expect(await castVote(poll.id, otherOption.id, voter.id)).toBe("gone");
  });
});
