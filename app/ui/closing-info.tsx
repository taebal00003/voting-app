import { formatClosingTime, remainingTime } from "@/lib/closing-display";

type Closing = { closesAt: Date | null; isClosed: boolean };

/** 목록용 한 줄 표시: 남은 시간(24시간 안이면 강조) 또는 "마감됨". 마감이 없으면 아무것도 없다. */
export function ClosingBadge({ closesAt, isClosed }: Closing) {
  if (isClosed) return <span className="text-xs text-slate-500">마감됨</span>;
  if (!closesAt) return null;
  const { label, urgent } = remainingTime(closesAt, new Date());
  return (
    <span className={`text-xs ${urgent ? "font-semibold text-amber-700" : "text-slate-500"}`}>{label}</span>
  );
}

/** 투표 화면용: 마감 시각과 남은 시간. 마감이 없으면 그렇다고 적는다. */
export function ClosingLine({ closesAt, isClosed }: Closing) {
  if (!closesAt) return <p className="text-sm text-slate-500">마감 없음 · 삭제될 때까지 진행돼요</p>;
  const when = `${formatClosingTime(closesAt)} 마감`;
  if (isClosed) return <p className="text-sm text-slate-500">{when} · 마감됨</p>;
  const { label, urgent } = remainingTime(closesAt, new Date());
  return (
    <p className="text-sm text-slate-600">
      {when} ·{" "}
      <span className={urgent ? "font-semibold text-amber-700" : undefined}>{label}</span>
    </p>
  );
}
