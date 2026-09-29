"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { castVoteAction, type VoteState } from "../actions";
import { saveMyChoice } from "./my-choice";

const messages: Record<NonNullable<VoteState["result"]>, string | null> = {
  ok: null,
  already: "이미 이 투표에 참여했어요.",
  gone: "삭제된 투표예요.",
  "no-voter": "투표 코드가 더 이상 유효하지 않아요. 코드를 다시 입력해 주세요.",
  "no-choice": "선택지를 하나 골라 주세요.",
};

type VoteOption = { id: string; label: string };

/** 투표 전에는 결과가 보이면 안 되므로 선택지의 이름만 받는다. */
export function VoteForm({ pollId, options }: { pollId: string; options: VoteOption[] }) {
  const router = useRouter();
  const [unchosen, setUnchosen] = useState(false);
  const [state, formAction, pending] = useActionState<VoteState, FormData>(
    async (prev, formData) => {
      const next = await castVoteAction(prev, formData);
      if (next.result === "ok") saveMyChoice(pollId, String(formData.get("optionId")));
      // 이미 참여했다면 결과 화면과 함께 안내가 보이도록 표시를 달아 다시 불러온다.
      if (next.result === "already") router.replace(`/polls/${pollId}?notice=already`);
      else if (next.result !== "no-choice") router.refresh();
      return next;
    },
    { result: null },
  );
  const message = unchosen ? messages["no-choice"] : state.result && messages[state.result];

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(e) => {
        // 선택지를 고르지 않았으면 확인 창을 띄우기 전에 먼저 알려준다.
        const chosen = new FormData(e.currentTarget).get("optionId");
        setUnchosen(!chosen);
        if (!chosen || !window.confirm("투표한 뒤에는 바꾸거나 취소할 수 없어요. 투표할까요?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="pollId" value={pollId} />
      <fieldset className="space-y-3">
        <legend className="sr-only">선택지</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="card flex cursor-pointer items-center gap-3 has-[:checked]:border-slate-900 has-[:checked]:ring-1 has-[:checked]:ring-slate-900"
          >
            <input type="radio" name="optionId" value={option.id} className="size-5 accent-slate-900" />
            <span className="font-medium">{option.label}</span>
          </label>
        ))}
      </fieldset>
      {message && <p className="error">{message}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "투표하는 중…" : "투표하기"}
      </button>
      <p className="text-center text-sm text-slate-500">투표하면 결과를 볼 수 있어요. 비밀 투표예요.</p>
    </form>
  );
}
