import { listRoster } from "@/lib/roster";
import { requireAdmin } from "@/lib/session";
import { ConfirmButton } from "../../ui/confirm-button";
import { reissueCodeAction, removeVoterAction } from "../actions";
import { AdminHeader } from "../ui";
import { AddVotersForm, CopyRosterButton } from "./roster-forms";

export default async function RosterPage() {
  await requireAdmin();
  const roster = await listRoster();

  return (
    <>
      <AdminHeader />
      <main className="space-y-6">
        <h1 className="text-2xl font-bold">투표자 명부</h1>

        <AddVotersForm />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{roster.length}명</h2>
            {roster.length > 0 && (
              <CopyRosterButton text={roster.map((v) => `${v.name}: ${v.code}`).join("\n")} />
            )}
          </div>
          <p className="text-xs text-slate-500">
            코드는 본인에게만 개인 메시지로 보내 주세요. 코드를 아는 사람은 그 투표자로 투표할 수 있어요.
          </p>
          <ul className="space-y-2">
            {roster.map((voter) => (
              <li key={voter.id} className="card flex items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{voter.name}</p>
                  <p className="font-mono text-sm tracking-widest text-slate-600 select-all">{voter.code}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={reissueCodeAction}>
                    <input type="hidden" name="voterId" value={voter.id} />
                    <ConfirmButton
                      message={`${voter.name}님의 코드를 재발급할까요? 지금 코드는 바로 쓸 수 없게 돼요.`}
                      className="btn-secondary h-9 px-3 text-sm"
                    >
                      재발급
                    </ConfirmButton>
                  </form>
                  <form action={removeVoterAction}>
                    <input type="hidden" name="voterId" value={voter.id} />
                    <ConfirmButton
                      message={`${voter.name}님을 명부에서 뺄까요? 코드는 바로 쓸 수 없게 되고, 이미 한 투표는 결과에 남아요.`}
                      className="btn-danger h-9 px-3 text-sm"
                    >
                      빼기
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
