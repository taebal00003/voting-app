import Link from "next/link";

export function DeletedPoll({ backHref }: { backHref: string }) {
  return (
    <main className="card space-y-4 text-center">
      <p className="text-lg font-semibold">삭제된 투표예요</p>
      <p className="text-slate-600">운영자가 이 투표를 삭제해서 더 이상 볼 수 없어요.</p>
      <Link href={backHref} className="btn-primary w-full">
        목록으로
      </Link>
    </main>
  );
}
