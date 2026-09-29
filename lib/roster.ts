import { isUuid, sql } from "./db";
import { generateVoterCode } from "./rules";

export type Voter = { id: string; name: string };
export type RosterEntry = Voter & { code: string };

export async function listRoster(): Promise<RosterEntry[]> {
  const rows = await sql`
    select id, name, code from voters
    where removed_at is null
    order by name`;
  return rows as RosterEntry[];
}

export async function findVoterByCode(code: string): Promise<Voter | null> {
  const rows = await sql`
    select id, name from voters
    where code = ${code} and removed_at is null`;
  return (rows[0] as Voter | undefined) ?? null;
}

/** 이미 명부에 있는 이름이 섞여 있으면 아무것도 등록하지 않고 그 이름들을 돌려준다. */
export async function addVoters(
  names: string[],
): Promise<{ added: number } | { taken: string[] }> {
  const takenRows = await sql`
    select name from voters
    where removed_at is null and name = any(${names}::text[])`;
  if (takenRows.length > 0) {
    return { taken: takenRows.map((r) => r.name as string) };
  }
  const codes = names.map(() => generateVoterCode());
  await sql`
    insert into voters (name, code)
    select * from unnest(${names}::text[], ${codes}::text[])`;
  return { added: names.length };
}

/** 코드는 즉시 무효가 되고, 이미 남긴 참여 기록과 투표 결과는 그대로 남는다. */
export async function removeVoter(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await sql`
    update voters set removed_at = now(), code = null
    where id = ${id} and removed_at is null`;
}

export async function reissueCode(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await sql`
    update voters set code = ${generateVoterCode()}
    where id = ${id} and removed_at is null`;
}
