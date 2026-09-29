// 결과 화면의 막대그래프가 쓰는 계산. 서버와 브라우저 양쪽에서 쓸 수 있다.
import type { Option } from "./polls";

type ResultRow = Option & {
  /** 전체 투표 수 대비 비율, 정수로 반올림 */
  percent: number;
  /** 표를 받았지만 반올림하면 0%인지. 0표와 구분해서 보여준다. */
  underOnePercent: boolean;
  /** 가장 많이 고른 선택지인지 (동률이면 모두) */
  leading: boolean;
};

export function summarizeResult(options: Option[]): { total: number; rows: ResultRow[] } {
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const top = Math.max(...options.map((o) => o.voteCount));
  return {
    total,
    rows: options.map((o) => {
      const percent = total === 0 ? 0 : Math.round((o.voteCount / total) * 100);
      return {
        ...o,
        percent,
        underOnePercent: o.voteCount > 0 && percent === 0,
        leading: total > 0 && o.voteCount === top,
      };
    }),
  };
}
