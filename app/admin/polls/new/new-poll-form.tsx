"use client";

import { useActionState, useState } from "react";
import { submitKeepingInput } from "../../../ui/submit-keeping-input";
import type { FormState } from "../../../actions";
import { LIMITS } from "@/lib/rules";
import { createPollAction } from "../../actions";

const { optionsMin: OPTIONS_MIN, optionsMax: OPTIONS_MAX } = LIMITS;

export function NewPollForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createPollAction, {
    error: null,
  });
  // 입력 순서가 바뀌어도 값이 섞이지 않도록 각 칸에 고유 key를 준다.
  const [keys, setKeys] = useState([1, 2]);
  const [nextKey, setNextKey] = useState(3);

  return (
    <form
      className="space-y-5"
      onSubmit={submitKeepingInput(formAction)}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">제목</span>
        <input name="title" className="input" maxLength={LIMITS.titleMax} placeholder="예: MT 장소는 어디로 할까요?" required />
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">
          선택지 ({OPTIONS_MIN}~{OPTIONS_MAX}개)
        </legend>
        {keys.map((key, i) => (
          <div key={key} className="flex gap-2">
            <input name="option" className="input" maxLength={LIMITS.optionLabelMax} placeholder={`선택지 ${i + 1}`} />
            {keys.length > OPTIONS_MIN && (
              <button
                type="button"
                className="btn-secondary shrink-0"
                aria-label={`선택지 ${i + 1} 삭제`}
                onClick={() => setKeys(keys.filter((k) => k !== key))}
              >
                삭제
              </button>
            )}
          </div>
        ))}
        {keys.length < OPTIONS_MAX && (
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => {
              setKeys([...keys, nextKey]);
              setNextKey(nextKey + 1);
            }}
          >
            + 선택지 추가
          </button>
        )}
      </fieldset>

      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "만드는 중…" : "투표 만들기"}
      </button>
    </form>
  );
}
