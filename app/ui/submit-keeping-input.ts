import { startTransition, type FormEvent } from "react";

/**
 * React 19의 form action은 끝나면 입력값을 초기화한다.
 * 검증 오류가 나도 입력한 내용이 남도록 action prop 대신 이 핸들러로 직접 제출한다.
 */
export function submitKeepingInput(formAction: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  };
}
