import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="space-y-6 pt-10">
      <h1 className="text-2xl font-bold">운영자 로그인</h1>
      <LoginForm />
    </main>
  );
}
