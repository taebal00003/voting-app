import { expect, test } from "vitest";
import { sql } from "../lib/db";

test("테스트 DB에 연결되고 스키마가 적용되어 있다", async () => {
  const rows = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public'`;
  expect(rows.map((r) => r.table_name)).toEqual(
    expect.arrayContaining(["voters", "polls", "options", "participations"]),
  );
});
