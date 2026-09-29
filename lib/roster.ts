import { isUuid, sql } from "./db";
import { checkRosterNames, normalizeVoterCode } from "./rules";
import { generateVoterCode } from "./voter-code";

export type Voter = { id: string; name: string };
export type RosterEntry = Voter & { code: string };

export async function listRoster(): Promise<RosterEntry[]> {
  const rows = await sql`
    select id, name, code from voters
    where removed_at is null
    order by name`;
  return rows as RosterEntry[];
}

/** 투표자가 입력한 그대로의 코드를 받는다. 대소문자, 공백, 하이픈 차이는 무시한다. */
export async function findVoterByCode(rawCode: string): Promise<Voter | null> {
  const code = normalizeVoterCode(rawCode);
  if (!code) return null;
  const rows = await sql`
    select id, name from voters
    where code = ${code} and removed_at is null`;
  return (rows[0] as Voter | undefined) ?? null;
}

export type AddVotersResult =
  | { ok: true; added: number }
  | { ok: false; error: string; taken?: string[] };

const UNIQUE_VIOLATION = "23505";
const ACTIVE_NAME_INDEX = "voters_active_name";
const CODE_ATTEMPTS = 3;

type PgError = { code?: string; constraint?: string };

/**
 * 운영자가 붙여 넣은 텍스트(한 줄에 이름 하나)를 받아 투표자를 등록하고 코드를 발급한다.
 * 한 번의 INSERT로 처리하므로, 이미 명부에 있는 이름이 하나라도 섞이면 아무도 등록되지 않는다.
 */
export async function addVoters(rawNames: string): Promise<AddVotersResult> {
  const checked = checkRosterNames(rawNames);
  if (!checked.ok) return checked;
  const names = checked.value;

  for (let attempt = 1; ; attempt++) {
    const codes = names.map(() => generateVoterCode());
    try {
      await sql`
        insert into voters (name, code)
        select * from unnest(${names}::text[], ${codes}::text[])`;
      return { ok: true, added: names.length };
    } catch (e) {
      const { code, constraint } = e as PgError;
      if (code !== UNIQUE_VIOLATION) throw e;
      if (constraint === ACTIVE_NAME_INDEX) return takenResult(names);
      // 투표 코드가 우연히 겹친 경우: 새 코드로 다시 시도한다.
      if (attempt >= CODE_ATTEMPTS) throw e;
    }
  }
}

async function takenResult(names: string[]): Promise<AddVotersResult> {
  const rows = await sql`
    select name from voters
    where removed_at is null and name = any(${names}::text[])
    order by name`;
  const taken = rows.map((r) => r.name as string);
  return { ok: false, taken, error: `이미 명부에 있는 이름이에요: ${taken.join(", ")}` };
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
