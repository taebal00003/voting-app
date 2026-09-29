import { requireAdmin } from "@/lib/session";
import { AdminHeader } from "../../ui";
import { NewPollForm } from "./new-poll-form";

export default async function NewPollPage() {
  await requireAdmin();
  return (
    <>
      <AdminHeader />
      <main className="space-y-4">
        <h1 className="text-2xl font-bold">새 투표</h1>
        <p className="text-sm text-slate-600">만든 뒤에는 수정할 수 없어요. 틀렸다면 삭제하고 다시 만들어 주세요.</p>
        <NewPollForm />
      </main>
    </>
  );
}
