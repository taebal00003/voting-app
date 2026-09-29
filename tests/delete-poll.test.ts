import { describe, expect, test } from "vitest";
import {
  castVote,
  createPoll,
  deletePoll,
  getPoll,
  getParticipationStatus,
  hasParticipated,
  listPollsFor,
  listPollsForAdmin,
} from "../lib/polls";
import { addVoters, listRoster } from "../lib/roster";
import { trackTestData } from "./test-data";

const data = trackTestData();

async function voterNamed(label: string) {
  const name = data.name(label);
  const added = await addVoters(name);
  if (!added.ok) throw new Error(added.error);
  return (await listRoster()).find((v) => v.name === name)!;
}

async function pollWithVote(label: string, voterId: string) {
  const created = await createPoll(data.title(label), ["피자", "치킨"]);
  if (!created.ok) throw new Error(created.error);
  const poll = (await getPoll(created.pollId))!;
  expect(await castVote(poll.id, poll.options[0].id, voterId)).toBe("ok");
  return poll;
}

describe("운영자가 투표를 삭제한다", () => {
  test("투표한 투표를 삭제하면 조회되지 않고 모든 목록과 참여 기록에서 사라진다", async () => {
    const voter = await voterNamed("철수");
    const poll = await pollWithVote("점심", voter.id);

    await deletePoll(poll.id);

    expect(await getPoll(poll.id)).toBeNull();
    expect((await listPollsForAdmin()).some((p) => p.id === poll.id)).toBe(false);
    expect((await listPollsFor(voter.id)).some((p) => p.id === poll.id)).toBe(false);
    expect(await hasParticipated(poll.id, voter.id)).toBe(false);
    expect((await getParticipationStatus(poll.id)).participated).toEqual([]);
  });

  test("삭제된 투표에 투표하면 없음으로 답한다", async () => {
    const voter = await voterNamed("영희");
    const other = await voterNamed("민수");
    const poll = await pollWithVote("회식", voter.id);

    await deletePoll(poll.id);

    expect(await castVote(poll.id, poll.options[1].id, other.id)).toBe("gone");
  });

  test("다른 투표의 선택지와 결과에는 영향이 없다", async () => {
    const voter = await voterNamed("지수");
    const doomed = await pollWithVote("지울것", voter.id);
    const kept = await pollWithVote("남길것", voter.id);

    await deletePoll(doomed.id);

    const after = await getPoll(kept.id);
    expect(after?.options.map((o) => [o.label, o.voteCount])).toEqual([
      ["피자", 1],
      ["치킨", 0],
    ]);
    expect(await hasParticipated(kept.id, voter.id)).toBe(true);
  });

  test("없는 ID나 잘못된 형식의 ID로 삭제해도 오류가 나지 않는다", async () => {
    await expect(deletePoll(crypto.randomUUID())).resolves.toBeUndefined();
    await expect(deletePoll("not-a-uuid")).resolves.toBeUndefined();
  });
});
