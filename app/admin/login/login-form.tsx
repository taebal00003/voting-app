"use client";

import { useActionState } from "react";
import type { FormState } from "../../actions";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, {
    error: null,
  });
  return (
    <form action={formAction} className="space-y-3">
      <input
        type="password"
        name="password"
        className="input"
        placeholder="운영자 비밀번호"
        autoComplete="current-password"
        required
      />
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
