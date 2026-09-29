import { isUuid, sql } from "./db";
import { CLOSING_TIME_PAST, checkPollDraft, parseClosingTime } from "./rules";

export type Option = { id: string; label: string; voteCount: number };

/** 마감 시각(null이면 마감 없음)과, DB 시각 기준으로 마감됐는지 (db/schema.sql의 poll_states) */
type Closing = { closesAt: Date | null; isClosed: boolean };

export type Poll = { id: string; title: string; options: Option[] } & Closing;
export type PollListItem = { id: string; title: string; participated: boolean } & Closing;
export type AdminPollListItem = { id: string; title: string; participationCount: number } & Closing;

function closingOf(row: Record<string, unknown>): Closing {
  return {
    closesAt: row.closes_at ? new Date(row.closes_at as string) : null,
    isClosed: row.is_closed === true,
  };
}

export async function listPollsFor(voterId: string): Promise<PollListItem[]> {
  if (!isUuid(voterId)) return [];
  const rows = await sql`
    select p.id, p.title, p.closes_at, s.is_closed,
      exists (
        select 1 from participations pa
        where pa.poll_id = p.id and pa.voter_id = ${voterId}
      ) as participated
    from polls p join poll_states s using (id)
    order by s.list_position`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    participated: r.participated,
    ...closingOf(r),
  }));
}

export async function listPollsForAdmin(): Promise<AdminPollListItem[]> {
  const rows = await sql`
    select p.id, p.title, p.closes_at, s.is_closed,
      (select count(*) from participations pa where pa.poll_id = p.id)::int as participation_count
    from polls p join poll_states s using (id)
    order by s.list_position`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    participationCount: r.participation_count,
    ...closingOf(r),
  }));
}

export async function getPoll(id: string): Promise<Poll | null> {
  if (!isUuid(id)) return null;
  const [pollRows, optionRows] = await Promise.all([
    sql`
      select p.id, p.title, p.closes_at, s.is_closed
      from polls p join poll_states s using (id) where p.id = ${id}`,
    sql`select id, label, vote_count from options where poll_id = ${id} order by position`,
  ]);
  const poll = pollRows[0];
  if (!poll) return null;
  return {
    id: poll.id,
    title: poll.title,
    ...closingOf(poll),
    options: optionRows.map((o) => ({ id: o.id, label: o.label, voteCount: o.vote_count })),
  };
}

export async function hasParticipated(pollId: string, voterId: string): Promise<boolean> {
  if (!isUuid(pollId) || !isUuid(voterId)) return false;
  const rows = await sql`
    select 1 from participations where poll_id = ${pollId} and voter_id = ${voterId}`;
  return rows.length > 0;
}

export type CastResult = "ok" | "already" | "closed" | "gone";

/**
 * 참여 기록 추가와 선택지 개수 증가를 한 SQL 문으로 처리해 둘 중 하나만 남는 일이 없게 한다.
 * 누가 무엇을 골랐는지는 어디에도 기록하지 않는다 (docs/adr/0002).
 */
export async function castVote(
  pollId: string,
  optionId: string,
  voterId: string,
): Promise<CastResult> {
  if (!isUuid(pollId) || !isUuid(optionId) || !isUuid(voterId)) return "gone";
  const rows = await sql`
    with participation as (
      insert into participations (poll_id, voter_id)
      select ${pollId}::uuid, ${voterId}::uuid
      where exists (
        select 1 from options o join poll_states s on s.id = o.poll_id
        where o.id = ${optionId} and o.poll_id = ${pollId} and not s.is_closed
      )
      on conflict do nothing
      returning 1
    )
    update options set vote_count = vote_count + 1
    where id = ${optionId} and poll_id = ${pollId}
      and exists (select 1 from participation)
    returning id`;
  if (rows.length > 0) return "ok";
  if (await hasParticipated(pollId, voterId)) return "already";
  // 마감된 투표의 선택지로 투표한 경우만 closed. 없는 투표나 다른 투표의 선택지는 gone이다.
  const closed = await sql`
    select 1 from options o join poll_states s on s.id = o.poll_id
    where o.id = ${optionId} and o.poll_id = ${pollId} and s.is_closed`;
  return closed.length > 0 ? "closed" : "gone";
}

export type CreatePollResult = { ok: true; pollId: string } | { ok: false; error: string };

/**
 * 운영자가 입력한 그대로의 제목, 선택지 칸들, 마감 시각(비우면 마감 없음)을 받아
 * 검증한 뒤 투표를 만든다. 마감 시각은 한국 시간으로 해석한다.
 */
export async function createPoll(
  rawTitle: string,
  rawOptions: string[],
  rawClosesAt = "",
): Promise<CreatePollResult> {
  const checked = checkPollDraft(rawTitle, rawOptions);
  if (!checked.ok) return checked;
  const closing = parseClosingTime(rawClosesAt);
  if (!closing.ok) return closing;
  const { title, options } = checked.value;
  const closesAt = closing.value?.toISOString() ?? null;
  // "지금 이후" 검사도 마감 판정과 같은 DB 시각으로 한다. 지난 시각이면 아무것도 만들지 않는다.
  const rows = await sql`
    with poll as (
      insert into polls (title, closes_at)
      select ${title}, ${closesAt}::timestamptz
      where ${closesAt}::timestamptz is null or ${closesAt}::timestamptz > now()
      returning id
    ), inserted as (
      insert into options (poll_id, label, position)
      select poll.id, o.label, o.position
      from poll, unnest(${options}::text[]) with ordinality as o(label, position)
    )
    select id from poll`;
  if (rows.length === 0) return { ok: false, error: CLOSING_TIME_PAST };
  return { ok: true, pollId: rows[0].id };
}

export async function deletePoll(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await sql`delete from polls where id = ${id}`;
}

export type ParticipationStatus = { participated: string[]; notYet: string[] };

/** 명부 기준 참여/미참여 이름. 이름순으로만 돌려주어 참여 순서가 드러나지 않게 한다. */
export async function getParticipationStatus(pollId: string): Promise<ParticipationStatus> {
  if (!isUuid(pollId)) return { participated: [], notYet: [] };
  const rows = await sql`
    select v.name, (pa.voter_id is not null) as participated
    from voters v
    left join participations pa on pa.voter_id = v.id and pa.poll_id = ${pollId}
    where v.removed_at is null or pa.voter_id is not null
    order by v.name`;
  return {
    participated: rows.filter((r) => r.participated).map((r) => r.name),
    notYet: rows.filter((r) => !r.participated).map((r) => r.name),
  };
}
