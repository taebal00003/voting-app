"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createPoll, deletePoll } from "@/lib/polls";
import { addVoters, reissueCode, removeVoter } from "@/lib/roster";
import { isAdminPassword } from "@/lib/admin-token";
import { endAdminSession, requireAdmin, startAdminSession } from "@/lib/session";
import type { FormState } from "../actions";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isAdminPassword(String(formData.get("password") ?? ""))) {
    return { error: "비밀번호가 맞지 않아요." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

export async function createPollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const result = await createPoll(
    String(formData.get("title") ?? ""),
    formData.getAll("option").map(String),
  );
  if (!result.ok) return { error: result.error };
  redirect(`/admin/polls/${result.pollId}`);
}

export async function deletePollAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deletePoll(String(formData.get("pollId") ?? ""));
  redirect("/admin");
}

export async function addVotersAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const result = await addVoters(String(formData.get("names") ?? ""));
  if (!result.ok) return { error: result.error };
  refresh();
  return { error: null };
}

export async function removeVoterAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await removeVoter(String(formData.get("voterId") ?? ""));
  refresh();
}

export async function reissueCodeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await reissueCode(String(formData.get("voterId") ?? ""));
  refresh();
}
