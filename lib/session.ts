import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, createAdminToken, isValidAdminToken } from "./admin-token";
import { findVoterByCode, type Voter } from "./roster";

const VOTER_COOKIE = "voter_code";
const VOTER_MAX_AGE = 365 * 24 * 60 * 60;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function startAdminSession(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, createAdminToken(), {
    ...cookieOptions,
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  return isValidAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** 운영자 페이지와 운영자용 Server Action마다 호출한다. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function rememberVoterCode(code: string): Promise<void> {
  (await cookies()).set(VOTER_COOKIE, code, { ...cookieOptions, maxAge: VOTER_MAX_AGE });
}

export async function forgetVoterCode(): Promise<void> {
  (await cookies()).delete(VOTER_COOKIE);
}

/** 브라우저가 기억한 투표 코드로 현재 투표자를 찾는다. 명부에서 빠졌거나 재발급된 코드면 null. */
export async function getCurrentVoter(): Promise<Voter | null> {
  const code = (await cookies()).get(VOTER_COOKIE)?.value;
  if (!code) return null;
  return findVoterByCode(code);
}
