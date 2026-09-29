import Link from "next/link";
import { logoutAction } from "./actions";

export function AdminHeader() {
  return (
    <header className="mb-6 flex items-center justify-between gap-2 text-sm">
      <nav className="flex gap-4 font-medium">
        <Link href="/admin">투표 관리</Link>
        <Link href="/admin/roster">투표자 명부</Link>
      </nav>
      <form action={logoutAction}>
        <button type="submit" className="text-slate-500 underline">
          로그아웃
        </button>
      </form>
    </header>
  );
}
