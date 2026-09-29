import { randomUUID } from "node:crypto";
import { afterEach } from "vitest";
import { sql } from "../lib/db";

/**
 * 테스트마다 고유 접두사를 만들고, 테스트가 끝나면 그 접두사로 만든 데이터를 지운다.
 * 투표자 이름과 투표 제목은 반드시 `name(...)`/`title(...)`로 만들어야 정리된다.
 */
export function trackTestData() {
  let prefix = "";
  const current = () => (prefix ||= `t${randomUUID().slice(0, 8)}_`);

  afterEach(async () => {
    if (prefix) await cleanup(prefix);
    prefix = "";
  });

  // 투표자 이름은 20자 제한이 있으므로 접두사(10자)를 짧게 유지한다.
  const tagged = (label: string) => `${current()}${label}`;
  return { name: tagged, title: tagged };
}

async function cleanup(prefix: string) {
  const pattern = `${prefix}%`;
  await sql`delete from polls where title like ${pattern}`;
  await sql`
    delete from participations
    where voter_id in (select id from voters where name like ${pattern})`;
  await sql`delete from voters where name like ${pattern}`;
}
