import { describe, expect, test } from "vitest";
import { summarizeResult } from "../lib/result-summary";

const option = (label: string, voteCount: number) => ({ id: label, label, voteCount });

describe("결과를 그래프로 보여주기 위해 요약한다", () => {
  test("총 투표 수와 선택지별 비율을 구하고, 가장 많이 고른 선택지를 1위로 표시한다", () => {
    const summary = summarizeResult([option("피자", 3), option("치킨", 1)]);

    expect(summary.total).toBe(4);
    expect(summary.rows.map((r) => [r.label, r.voteCount, r.percent, r.leading])).toEqual([
      ["피자", 3, 75, true],
      ["치킨", 1, 25, false],
    ]);
  });

  test("아직 아무도 투표하지 않았으면 모두 0%이고 1위는 없다", () => {
    const summary = summarizeResult([option("피자", 0), option("치킨", 0)]);

    expect(summary.total).toBe(0);
    expect(summary.rows.map((r) => [r.percent, r.leading])).toEqual([
      [0, false],
      [0, false],
    ]);
  });

  test("가장 많이 고른 선택지가 여럿이면 모두 1위로 표시한다", () => {
    const summary = summarizeResult([option("피자", 2), option("치킨", 2), option("짜장면", 1)]);

    expect(summary.rows.map((r) => [r.label, r.leading])).toEqual([
      ["피자", true],
      ["치킨", true],
      ["짜장면", false],
    ]);
  });

  test("비율은 정수로 반올림한다 (합이 100이 되도록 맞추지는 않는다)", () => {
    const twoToOne = summarizeResult([option("가", 2), option("나", 1)]);
    const even = summarizeResult([option("가", 1), option("나", 1), option("다", 1)]);

    expect(twoToOne.rows.map((r) => r.percent)).toEqual([67, 33]);
    expect(even.rows.map((r) => r.percent)).toEqual([33, 33, 33]);
  });

  test("표를 받았지만 반올림하면 0%인 선택지는 1% 미만으로 구분한다", () => {
    const summary = summarizeResult([option("가", 249), option("나", 1), option("다", 0)]);

    expect(summary.rows.map((r) => [r.label, r.percent, r.underOnePercent])).toEqual([
      ["가", 100, false],
      ["나", 0, true],
      ["다", 0, false],
    ]);
  });
});
