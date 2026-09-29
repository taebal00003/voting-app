import { randomUUID } from "node:crypto";
import { afterEach } from "vitest";
import { sql } from "../lib/db";

/**
 * 테스트마다 고유 접두사를 만들고, 테스트가 끝나면 그 접두사로 만든 데이터를 지운다.
 * 투표자 이름과 투표 제목은 반드시 `name(...)`/`title(...)`로 만들어야 정리된다.
 */
export function useTestData() {
  let prefix = "";
  const tags = new Set<string>();

  const current = () => {
    if (!prefix) {
      prefix = `t${randomUUID().slice(0, 8)}_`;
      tags.add(prefix);
    }
    return prefix;
  };

  afterEach(async () => {
    for (const tag of tags) await cleanup(tag);
    tags.clear();
    prefix = "";
  });

  return {
    /** 투표자 이름 (20자 제한 안에 들어가도록 짧게) */
    name: (label: string) => `${current()}${label}`,
    /** 투표 제목 */
    title: (label: string) => `${current()}${label}`,
  };
}

async function cleanup(prefix: string) {
  const pattern = `${prefix}%`;
  await sql`delete from polls where title like ${pattern}`;
  await sql`
    delete from participations
    where voter_id in (select id from voters where name like ${pattern})`;
  await sql`delete from voters where name like ${pattern}`;
}
