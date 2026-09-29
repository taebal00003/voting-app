"use server";

import { castVote, type CastResult } from "@/lib/polls";
import { findVoterByCode } from "@/lib/roster";
import { normalizeVoterCode } from "@/lib/rules";
import { forgetVoterCode, getCurrentVoter, rememberVoterCode } from "@/lib/session";

export type FormState = { error: string | null };

export async function enterCodeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "");
  // 공백이나 하이픈만 넣은 경우도 "틀린 코드"가 아니라 "입력 안 함"으로 안내한다.
  if (!normalizeVoterCode(code)) return { error: "투표 코드를 입력해 주세요." };
  const voter = await findVoterByCode(code);
  if (!voter) return { error: "맞지 않는 투표 코드예요. 운영자에게 받은 코드를 확인해 주세요." };
  // 쿠키가 바뀌면 현재 페이지가 서버에서 다시 렌더링되어 코드 입력 화면이 사라진다.
  await rememberVoterCode(code);
  return { error: null };
}

export async function forgetCodeAction(): Promise<void> {
  await forgetVoterCode();
}

export type VoteState = { result: CastResult | "no-voter" | "no-choice" | null };

export async function castVoteAction(_prev: VoteState, formData: FormData): Promise<VoteState> {
  const voter = await getCurrentVoter();
  if (!voter) return { result: "no-voter" };
  const pollId = String(formData.get("pollId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  if (!optionId) return { result: "no-choice" };
  return { result: await castVote(pollId, optionId, voter.id) };
}
