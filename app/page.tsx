import Link from "next/link";
import { listPollsFor } from "@/lib/polls";
import { getCurrentVoter } from "@/lib/session";
import { ClosingBadge } from "./ui/closing-info";
import { CodeEntry } from "./ui/code-entry";
import { VoterHeader } from "./ui/voter-header";

export default async function Home() {
  const voter = await getCurrentVoter();
  if (!voter) return <CodeEntry />;

  const polls = await listPollsFor(voter.id);

  return (
    <>
      <VoterHeader voter={voter} />
      <main className="space-y-4">
        <h1 className="text-2xl font-bold">투표</h1>
        {polls.length === 0 ? (
          <p className="card text-center text-slate-600">아직 올라온 투표가 없어요.</p>
        ) : (
          <ul className="space-y-3">
            {polls.map((poll) => (
              <li key={poll.id}>
                <Link
                  href={`/polls/${poll.id}`}
                  className="card flex items-center justify-between gap-3 hover:border-slate-400"
                >
                  <span className="min-w-0 space-y-0.5">
                    <span className="block font-medium">{poll.title}</span>
                    <ClosingBadge closesAt={poll.closesAt} isClosed={poll.isClosed} />
                  </span>
                  {poll.participated ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      투표 완료
                    </span>
                  ) : poll.isClosed ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      결과 보기
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-xs text-white">
                      투표하기
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
