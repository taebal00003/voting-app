import Link from "next/link";
import { getPoll, getParticipationStatus } from "@/lib/polls";
import { requireAdmin } from "@/lib/session";
import { ClosingLine } from "../../../ui/closing-info";
import { ConfirmButton } from "../../../ui/confirm-button";
import { DeletedPoll } from "../../../ui/deleted-poll";
import { ResultView } from "../../../ui/result-view";
import { deletePollAction } from "../../actions";
import { AdminHeader } from "../../ui";

export default async function AdminPollPage(props: PageProps<"/admin/polls/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const poll = await getPoll(id);
  if (!poll) return <DeletedPoll backHref="/admin" />;
  const status = await getParticipationStatus(poll.id);

  return (
    <>
      <AdminHeader />
      <main className="space-y-6">
        <div className="space-y-2">
          <Link href="/admin" className="text-sm text-slate-500">
            ← 목록
          </Link>
          <h1 className="text-xl font-bold">{poll.title}</h1>
          <ClosingLine closesAt={poll.closesAt} isClosed={poll.isClosed} />
        </div>

        <ResultView poll={poll} showMyChoice={false} />

        <section className="card space-y-3">
          <h2 className="font-semibold">참여 현황</h2>
          <p className="text-xs text-slate-500">비밀 투표라서 누가 무엇을 골랐는지는 알 수 없어요.</p>
          <NameList title={`참여 ${status.participated.length}명`} names={status.participated} />
          <NameList title={`미참여 ${status.notYet.length}명`} names={status.notYet} />
        </section>

        <form action={deletePollAction}>
          <input type="hidden" name="pollId" value={poll.id} />
          <ConfirmButton
            message="이 투표를 삭제할까요? 선택지와 결과가 모두 영구히 사라져요."
            className="btn-danger w-full"
          >
            투표 삭제
          </ConfirmButton>
        </form>
      </main>
    </>
  );
}

function NameList({ title, names }: { title: string; names: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-slate-600">{names.length > 0 ? names.join(", ") : "없음"}</p>
    </div>
  );
}
