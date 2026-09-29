import type { Poll } from "@/lib/polls";
import { summarizeResult } from "@/lib/result-summary";
import { MyChoiceBadge } from "./my-choice-badge";

/** 선택지별 비율 가로 막대그래프. 투표자 화면과 운영자 화면이 함께 쓴다. */
export function ResultView({ poll, showMyChoice }: { poll: Poll; showMyChoice: boolean }) {
  const { total, rows } = summarizeResult(poll.options);

  return (
    <section className="space-y-4" aria-labelledby={`result-${poll.id}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={`result-${poll.id}`} className="font-semibold">
          결과
        </h2>
        <p className="text-sm text-slate-600">
          총 <strong className="tabular-nums text-slate-900">{total}명</strong> 참여
        </p>
      </div>

      <ul className="card space-y-4">
        {rows.map((row) => (
          <li key={row.id}>
            <span className="sr-only">
              {row.label}, {row.voteCount}명, {row.underOnePercent ? "1% 미만" : `${row.percent}%`}
              {row.leading ? ", 1위" : ""}
            </span>
            <div className="flex items-start justify-between gap-3" aria-hidden>
              <span className="min-w-0 break-words font-medium">
                {row.label}
                {row.leading && <span className="ml-1.5 text-xs font-semibold text-slate-900">1위</span>}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-slate-600">
                {row.voteCount}명 ·{" "}
                <strong className="text-slate-900">{row.underOnePercent ? "1% 미만" : `${row.percent}%`}</strong>
              </span>
            </div>
            {showMyChoice && (
              <div className="mt-1 empty:hidden">
                <MyChoiceBadge pollId={poll.id} optionId={row.id} />
              </div>
            )}
            {/* 막대는 왼쪽 기준선에서 시작하고 데이터 끝(오른쪽)만 둥글다. */}
            <div className="mt-1.5 h-3 overflow-hidden rounded-r-[4px] bg-slate-100" aria-hidden>
              <div
                className={`h-full rounded-r-[4px] ${row.underOnePercent ? "min-w-1" : ""} ${
                  row.leading ? "bg-slate-800" : "bg-slate-400"
                }`}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">새로고침하면 최신 결과를 볼 수 있어요.</p>
    </section>
  );
}
