import Link from "next/link";
import { listPollsForAdmin } from "@/lib/polls";
import { requireAdmin } from "@/lib/session";
import { AdminHeader } from "./ui";

export default async function AdminPage() {
  await requireAdmin();
  const polls = await listPollsForAdmin();

  return (
    <>
      <AdminHeader />
      <main className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">투표 관리</h1>
          <Link href="/admin/polls/new" className="btn-primary">
            새 투표
          </Link>
        </div>
        {polls.length === 0 ? (
          <p className="card text-center text-slate-600">아직 만든 투표가 없어요.</p>
        ) : (
          <ul className="space-y-3">
            {polls.map((poll) => (
              <li key={poll.id}>
                <Link
                  href={`/admin/polls/${poll.id}`}
                  className="card flex items-center justify-between gap-3 hover:border-slate-400"
                >
                  <span className="font-medium">{poll.title}</span>
                  <span className="shrink-0 text-sm text-slate-600">{poll.participationCount}명 참여</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
