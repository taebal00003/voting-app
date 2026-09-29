import { closingState, formatClosingTime } from "@/lib/closing-display";
import type { Closing } from "@/lib/polls";

const URGENT = "font-semibold text-amber-700";

/**
 * 목록용 한 줄 표시. 진행 중이면 남은 시간(24시간 안이면 강조), 마감됐으면 "마감됨".
 * withTime이면 마감 시각도 함께 적는다(운영자 목록). 마감이 없으면 아무것도 없다.
 */
export function ClosingBadge({ closing, withTime = false }: { closing: Closing; withTime?: boolean }) {
  const state = closingState(closing);
  if (state.kind === "none") return null;
  const when = withTime ? `${formatClosingTime(state.closesAt, closing.checkedAt)} · ` : "";
  if (state.kind === "closed") return <span className="text-xs text-slate-500">{when}마감됨</span>;
  return (
    <span className="text-xs text-slate-500">
      {when}
      <span className={state.urgent ? URGENT : undefined}>{state.label}</span>
    </span>
  );
}

/** 투표 화면용: 마감 시각과 남은 시간. 마감이 없으면 그렇다고 적는다. */
export function ClosingLine({ closing }: { closing: Closing }) {
  const state = closingState(closing);
  if (state.kind === "none") {
    return <p className="text-sm text-slate-500">마감 없음 · 삭제될 때까지 진행돼요</p>;
  }
  const when = `${formatClosingTime(state.closesAt, closing.checkedAt)} 마감`;
  if (state.kind === "closed") return <p className="text-sm text-slate-500">{when} · 마감됨</p>;
  return (
    <p className="text-sm text-slate-600">
      {when} · <span className={state.urgent ? URGENT : undefined}>{state.label}</span>
    </p>
  );
}
