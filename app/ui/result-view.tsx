import type { Poll } from "@/lib/polls";
import { MyChoiceBadge } from "./my-choice-badge";

export function ResultView({ poll, showMyChoice }: { poll: Poll; showMyChoice: boolean }) {
  const total = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  const top = Math.max(...poll.options.map((o) => o.voteCount));

  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">
        총 <strong className="text-slate-900">{total}명</strong> 참여 · 새로고침하면 최신 결과를 볼 수 있어요
      </p>
      <ul className="space-y-3">
        {poll.options.map((option) => {
          const percent = total === 0 ? 0 : Math.round((option.voteCount / total) * 100);
          const leading = total > 0 && option.voteCount === top;
          return (
            <li key={option.id} className="card space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  {option.label}
                  {showMyChoice && <MyChoiceBadge pollId={poll.id} optionId={option.id} />}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-slate-600">
                  {option.voteCount}표 · {percent}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${leading ? "bg-slate-900" : "bg-slate-400"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
