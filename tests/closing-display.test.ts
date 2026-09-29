import { describe, expect, test } from "vitest";
import { closingState, formatClosingTime, remainingTime } from "../lib/closing-display";

const now = new Date("2026-10-01T09:00:00Z");
const after = (ms: number) => new Date(now.getTime() + ms);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe("진행 중인 투표의 남은 시간을 알려준다", () => {
  test("몇 시간 남았으면 시간 단위로 알려주고, 24시간 안이라 강조한다", () => {
    expect(remainingTime(after(5 * HOUR + 30 * MINUTE), now)).toEqual({
      label: "마감까지 5시간",
      urgent: true,
    });
  });

  test("24시간 이상 남았으면 일 단위로 알려주고 강조하지 않는다", () => {
    expect(remainingTime(after(24 * HOUR), now)).toEqual({ label: "마감까지 1일", urgent: false });
    expect(remainingTime(after(47 * HOUR + 59 * MINUTE), now)).toEqual({
      label: "마감까지 1일",
      urgent: false,
    });
    expect(remainingTime(after(24 * HOUR - 1), now)).toEqual({ label: "마감까지 23시간", urgent: true });
  });

  test("1시간 안이면 분 단위로, 1분 안이면 곧 마감으로 알려준다", () => {
    expect(remainingTime(after(HOUR), now).label).toBe("마감까지 1시간");
    expect(remainingTime(after(HOUR - 1), now).label).toBe("마감까지 59분");
    expect(remainingTime(after(MINUTE), now).label).toBe("마감까지 1분");
    expect(remainingTime(after(MINUTE - 1), now)).toEqual({ label: "곧 마감", urgent: true });
    expect(remainingTime(after(0), now)).toEqual({ label: "곧 마감", urgent: true });
  });
});

describe("마감 시각을 한국 시간으로 보여준다", () => {
  test("올해 마감이면 월, 일, 요일, 24시간제 시각으로 적는다", () => {
    expect(formatClosingTime(new Date("2026-10-03T09:00:00Z"), now)).toBe("10월 3일 (토) 18:00");
  });

  test("한국 날짜로 해가 바뀌면 연도를 붙인다 (UTC로는 아직 올해여도)", () => {
    expect(formatClosingTime(new Date("2026-12-31T15:30:00Z"), now)).toBe("2027년 1월 1일 (금) 00:30");
  });

  test("월말에서 다음 달로 넘어가는 한국 날짜를 적는다", () => {
    expect(formatClosingTime(new Date("2026-10-31T16:00:00Z"), now)).toBe("11월 1일 (일) 01:00");
  });
});

describe("화면에 보여줄 마감 상태", () => {
  const closesAt = after(3 * HOUR);

  test("마감 시각이 없으면 마감 없음이다", () => {
    expect(closingState({ closesAt: null, isClosed: false, checkedAt: now })).toEqual({ kind: "none" });
  });

  test("DB가 마감됐다고 판정하면 남은 시간과 상관없이 마감됨이다", () => {
    expect(closingState({ closesAt, isClosed: true, checkedAt: now })).toEqual({ kind: "closed", closesAt });
  });

  test("진행 중이면 DB 판정 시각을 기준으로 남은 시간을 계산한다", () => {
    expect(closingState({ closesAt, isClosed: false, checkedAt: after(HOUR) })).toEqual({
      kind: "open",
      closesAt,
      label: "마감까지 2시간",
      urgent: true,
    });
  });
});
