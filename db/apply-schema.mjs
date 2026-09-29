import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

/** 스키마를 적용한다. 모든 구문이 `if not exists`라서 여러 번 실행해도 안전하다. */
export async function applySchema(databaseUrl) {
  const sql = neon(databaseUrl);
  const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  const statements = schema
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
  return statements.length;
}
