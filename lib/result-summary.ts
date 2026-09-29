// 결과 화면의 막대그래프가 쓰는 계산. DB나 Node 전용 모듈에 의존하지 않는다.

type CountedOption = { id: string; label: string; voteCount: number };

export type ResultRow = CountedOption & {
  /** 전체 투표 수 대비 비율, 정수로 반올림 */
  percent: number;
  /** 가장 많이 고른 선택지인지 (동률이면 모두) */
  leading: boolean;
};

export type ResultSummary = { total: number; rows: ResultRow[] };

export function summarizeResult(options: CountedOption[]): ResultSummary {
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const top = Math.max(...options.map((o) => o.voteCount));
  return {
    total,
    rows: options.map((o) => ({
      ...o,
      percent: total === 0 ? 0 : Math.round((o.voteCount / total) * 100),
      leading: total > 0 && o.voteCount === top,
    })),
  };
}
