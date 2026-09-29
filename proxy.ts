import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidAdminToken } from "./lib/admin-token";

// 운영자 경로 전체를 한 곳에서 미리 거른다. 쿠키 서명만 확인하는 낙관적 검사이며,
// 페이지와 Server Action 안의 권한 확인(requireAdmin)을 대신하지 않는다.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (isValidAdminToken(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
