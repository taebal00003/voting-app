"use client";

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "../../actions";
import { addVotersAction } from "../actions";

export function AddVotersForm() {
  const [names, setNames] = useState("");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const next = await addVotersAction(prev, formData);
      if (!next.error) setNames("");
      return next;
    },
    { error: null },
  );
  return (
    <form
      className="card space-y-3"
      // action prop 대신 직접 제출해서, 오류가 나도 입력한 이름이 지워지지 않게 한다.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">투표자 추가</span>
        <textarea
          name="names"
          value={names}
          onChange={(e) => setNames(e.target.value)}
          rows={4}
          className="input h-auto py-2"
          placeholder={"이름을 한 줄에 하나씩\n동명이인은 김철수(21학번)처럼 구분"}
          required
        />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "등록하는 중…" : "등록하고 코드 발급"}
      </button>
    </form>
  );
}

export function CopyRosterButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary h-9 px-3 text-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("복사해서 쓰세요", text);
        }
      }}
    >
      {copied ? "복사됨" : "이름: 코드 전체 복사"}
    </button>
  );
}
