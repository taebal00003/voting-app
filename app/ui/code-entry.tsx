"use client";

import Link from "next/link";
import { useActionState } from "react";
import { enterCodeAction, type FormState } from "../actions";

export function CodeEntry() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(enterCodeAction, {
    error: null,
  });

  return (
    <main className="space-y-6 pt-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">투표 코드 입력</h1>
        <p className="text-slate-600">
          운영자에게 받은 개인 투표 코드를 입력해 주세요. 이 기기에서는 한 번만 입력하면 돼요.
        </p>
      </div>
      <form action={formAction} className="space-y-3">
        <input
          name="code"
          className="input font-mono uppercase tracking-widest"
          placeholder="예: ABCD2345"
          autoComplete="off"
          autoCapitalize="characters"
          required
        />
        {state.error && <p className="error">{state.error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "확인 중…" : "확인"}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link href="/admin" className="text-slate-500 underline">
          운영자 로그인
        </Link>
      </p>
    </main>
  );
}
