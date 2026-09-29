import { describe, expect, test } from "vitest";
import { createPoll, getPoll, listPollsFor, listPollsForAdmin } from "../lib/polls";
import { addVoters, listRoster } from "../lib/roster";
import { trackTestData } from "./test-data";

const data = trackTestData();

async function created(title: string, options: string[]) {
  const result = await createPoll(title, options);
  if (!result.ok) throw new Error(`투표를 만들지 못함: ${result.error}`);
  return result.pollId;
}

async function adminPollTitles(title: string) {
  return (await listPollsForAdmin()).filter((p) => p.title === title);
}

const options = (n: number) => Array.from({ length: n }, (_, i) => `선택지${i + 1}`);

describe("운영자가 투표를 만든다", () => {
  test("제목과 선택지로 만든 투표는 입력한 순서대로 표 0개인 선택지를 가진다", async () => {
    const pollId = await created(data.title("점심"), ["피자", "치킨", "짜장면"]);

    const poll = await getPoll(pollId);

    expect(poll?.options.map((o) => [o.label, o.voteCount])).toEqual([
      ["피자", 0],
      ["치킨", 0],
      ["짜장면", 0],
    ]);
  });

  test("제목과 선택지의 앞뒤 공백은 정리되고 빈 선택지 칸은 무시된다", async () => {
    const title = data.title("회식");
    const pollId = await created(`  ${title}  `, [" 고기 ", "", "   ", "회"]);

    const poll = await getPoll(pollId);

    expect(poll?.title).toBe(title);
    expect(poll?.options.map((o) => o.label)).toEqual(["고기", "회"]);
  });

  test.each([
    ["제목이 비어 있음", "   ", ["가", "나"]],
    ["제목이 100자를 넘음", "가".repeat(101), ["가", "나"]],
    ["선택지가 2개 미만", "제목", ["가", "  "]],
    ["선택지가 10개 초과", "제목", options(11)],
    ["선택지가 50자를 넘음", "제목", ["가", "나".repeat(51)]],
    ["같은 문구의 선택지가 있음", "제목", ["피자", " 피자 "]],
  ])("%s이면 만들지 않고 오류 문구를 돌려준다", async (_case, rawTitle, rawOptions) => {
    const title = rawTitle === "제목" ? data.title("거부") : rawTitle;

    const result = await createPoll(title, rawOptions);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toBe("");
    if (title.trim()) expect(await adminPollTitles(title.trim())).toEqual([]);
  });

  test("제목 100자, 선택지 10개, 선택지 50자까지는 만들 수 있다", async () => {
    const title = data.title("가".repeat(90));
    const result = await createPoll(title, [...options(9), "나".repeat(50)]);

    expect(result.ok).toBe(true);
  });

  test("운영자 목록 맨 앞에 참여 0명으로 나온다", async () => {
    await created(data.title("먼저"), ["가", "나"]);
    const title = data.title("나중");
    await created(title, ["가", "나"]);

    const [latest] = await listPollsForAdmin();

    expect(latest).toMatchObject({ title, participationCount: 0 });
  });

  test("투표자 목록에 최신순으로 나오고 아직 투표 완료가 아니다", async () => {
    await addVoters(data.name("철수"));
    const voter = (await listRoster()).find((v) => v.name === data.name("철수"))!;
    const first = data.title("첫째");
    const second = data.title("둘째");
    await created(first, ["가", "나"]);
    await created(second, ["가", "나"]);

    const mine = (await listPollsFor(voter.id)).filter((p) => p.title === first || p.title === second);

    expect(mine.map((p) => [p.title, p.participated])).toEqual([
      [second, false],
      [first, false],
    ]);
  });
});
