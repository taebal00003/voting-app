import { createHmac, timingSafeEqual } from "node:crypto";

// next/headers나 DB에 의존하지 않아서 proxy에서도 쓸 수 있다.

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_MAX_AGE = 7 * 24 * 60 * 60;

function adminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
  return password;
}

// 비밀번호 자체를 서명 키로 쓰므로, 비밀번호를 바꾸면 기존 운영자 로그인이 모두 무효가 된다.
function sign(value: string): string {
  return createHmac("sha256", adminPassword()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function isAdminPassword(input: string): boolean {
  return safeEqual(sign(`check:${input}`), sign(`check:${adminPassword()}`));
}

export function createAdminToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE;
  return `${expiresAt}.${sign(`admin:${expiresAt}`)}`;
}

export function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!signature || Number(expiresAt) < Date.now() / 1000) return false;
  return safeEqual(signature, sign(`admin:${expiresAt}`));
}
