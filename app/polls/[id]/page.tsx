import Link from "next/link";
import { getPoll, hasParticipated } from "@/lib/polls";
import { getCurrentVoter } from "@/lib/session";
import { ClosingLine } from "../../ui/closing-info";
import { CodeEntry } from "../../ui/code-entry";
import { DeletedPoll } from "../../ui/deleted-poll";
import { ResultView } from "../../ui/result-view";
import { VoteForm } from "../../ui/vote-form";
import { VoterHeader } from "../../ui/voter-header";

export default async function PollPage(props: PageProps<"/polls/[id]">) {
  const { id } = await props.params;
  const { notice } = await props.searchParams;
  const voter = await getCurrentVoter();
  if (!voter) return <CodeEntry />;

  const poll = await getPoll(id);
  if (!poll) return <DeletedPoll backHref="/" />;

  const participated = await hasParticipated(poll.id, voter.id);

  return (
    <>
      <VoterHeader voter={voter} />
      <main className="space-y-5">
        <Link href="/" className="text-sm text-slate-500">
          ← 목록
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{poll.title}</h1>
          <ClosingLine closing={poll} />
        </div>
        {participated && notice === "already" && (
          <p className="card text-sm text-slate-700">이미 이 투표에 참여했어요. 결과는 아래와 같아요.</p>
        )}
        {!participated && (
          <VoteForm
            pollId={poll.id}
            options={poll.options.map(({ id, label }) => ({ id, label }))}
            closed={poll.isClosed}
          />
        )}
        {/* 투표 전에는 결과를 보여주지 않는다. 마감된 뒤에는 명부의 모든 투표자에게 공개한다. */}
        {(participated || poll.isClosed) && <ResultView poll={poll} showMyChoice={participated} />}
      </main>
    </>
  );
}
