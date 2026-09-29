import type { Voter } from "@/lib/roster";
import { forgetCodeAction } from "../actions";
import { ConfirmButton } from "./confirm-button";

export function VoterHeader({ voter }: { voter: Voter }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-2 text-sm text-slate-600">
      <span>
        <strong className="text-slate-900">{voter.name}</strong>님
      </span>
      <form action={forgetCodeAction}>
        <ConfirmButton
          message="이 기기에서 투표 코드를 지울까요? 다시 투표하려면 코드를 입력해야 해요."
          className="text-slate-500 underline"
        >
          코드 지우기
        </ConfirmButton>
      </form>
    </header>
  );
}
