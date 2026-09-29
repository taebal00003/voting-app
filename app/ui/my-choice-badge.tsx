"use client";

import { useSyncExternalStore } from "react";
import { readMyChoice } from "./my-choice";

const noSubscribe = () => () => {};

export function MyChoiceBadge({ pollId, optionId }: { pollId: string; optionId: string }) {
  const mine = useSyncExternalStore(
    noSubscribe,
    () => readMyChoice(pollId) === optionId,
    () => false,
  );
  if (!mine) return null;
  return (
    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
      내 선택
    </span>
  );
}
