import { describe, expect, test } from "vitest";
import { addVoters, findVoterByCode, listRoster, reissueCode, removeVoter } from "../lib/roster";
import { trackTestData } from "./test-data";

const data = trackTestData();

async function rosterNamed(...names: string[]) {
  return (await listRoster()).filter((v) => names.includes(v.name));
}

describe("운영자가 투표자 명부를 관리한다", () => {
  test("한 줄에 하나씩 붙여 넣은 이름이 한 번에 등록되고 각자 투표 코드를 받는다", async () => {
    const [a, b] = [data.name("영희"), data.name("철수")];

    const result = await addVoters(`${a}\r\n\n  ${b}  \n`);

    expect(result).toEqual({ ok: true, added: 2 });
    const roster = await rosterNamed(a, b);
    expect(roster.map((v) => v.name)).toEqual([a, b].sort());
    // 스펙: 헷갈리는 글자(0/O, 1/I/L)를 뺀 8자리 대문자·숫자
    for (const voter of roster) {
      expect(voter.code).toMatch(/^[A-Z2-9]{8}$/);
      expect(voter.code).not.toMatch(/[01OIL]/);
    }
  });

  test("이미 명부에 있는 이름이 섞이면 아무도 등록되지 않고 겹친 이름을 알려준다", async () => {
    const [kept, fresh] = [data.name("민수"), data.name("지수")];
    await addVoters(kept);

    const result = await addVoters(`${fresh}\n${kept}`);

    expect(result).toEqual({ ok: false, taken: [kept], error: expect.stringContaining(kept) });
    expect((await rosterNamed(fresh, kept)).map((v) => v.name)).toEqual([kept]);
  });

  test("투표자는 받은 코드를 소문자, 공백, 하이픈을 섞어 입력해도 본인으로 찾아진다", async () => {
    const name = data.name("수아");
    await addVoters(name);
    const [{ code }] = await rosterNamed(name);
    const sloppy = ` ${code.slice(0, 4).toLowerCase()}-${code.slice(4)} `;

    expect((await findVoterByCode(sloppy))?.name).toBe(name);
  });

  test("틀린 코드나 빈 코드로는 아무도 찾아지지 않는다", async () => {
    expect(await findVoterByCode("ZZZZZZZZ")).toBeNull();
    expect(await findVoterByCode("   ")).toBeNull();
  });

  test.each([
    ["입력한 목록에 같은 이름이 두 번 있음", (n: string) => `${n}\n${n}`],
    ["이름이 20자를 넘음", (n: string) => `${n}${"가".repeat(20)}`],
    ["이름이 하나도 없음", () => " \n \n"],
  ])("%s이면 아무도 등록되지 않고 오류 문구를 돌려준다", async (_case, input) => {
    const name = data.name("거부");

    const result = await addVoters(input(name));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toBe("");
    expect(await rosterNamed(name)).toEqual([]);
  });

  test("명부는 이름순으로 보인다", async () => {
    const names = [data.name("다"), data.name("가"), data.name("나")];
    await addVoters(names.join("\n"));

    expect((await rosterNamed(...names)).map((v) => v.name)).toEqual([
      data.name("가"),
      data.name("나"),
      data.name("다"),
    ]);
  });

  test("코드를 재발급하면 새 코드로만 찾아지고 이전 코드는 무효가 된다", async () => {
    const name = data.name("하준");
    await addVoters(name);
    const [before] = await rosterNamed(name);

    await reissueCode(before.id);

    const [after] = await rosterNamed(name);
    expect(after.code).not.toBe(before.code);
    expect(await findVoterByCode(before.code)).toBeNull();
    expect((await findVoterByCode(after.code))?.name).toBe(name);
  });

  test("명부에서 뺀 투표자는 목록에서 사라지고 코드도 무효가 된다", async () => {
    const name = data.name("서준");
    await addVoters(name);
    const [voter] = await rosterNamed(name);

    await removeVoter(voter.id);

    expect(await rosterNamed(name)).toEqual([]);
    expect(await findVoterByCode(voter.code)).toBeNull();
  });

  test("명부에서 뺀 이름은 다시 등록할 수 있고 새 코드를 받는다", async () => {
    const name = data.name("도윤");
    await addVoters(name);
    const [removed] = await rosterNamed(name);
    await removeVoter(removed.id);

    const result = await addVoters(name);

    expect(result).toEqual({ ok: true, added: 1 });
    const [again] = await rosterNamed(name);
    expect(again.code).not.toBe(removed.code);
  });

  test("잘못된 형식의 ID로 재발급하거나 빼도 오류가 나지 않는다", async () => {
    await expect(reissueCode("not-a-uuid")).resolves.toBeUndefined();
    await expect(removeVoter("not-a-uuid")).resolves.toBeUndefined();
  });
});
