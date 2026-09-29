import { isUuid, sql } from "./db";
import { checkClosingTime, checkPollDraft } from "./rules";

export type Option = { id: string; label: string; voteCount: number };
export type Poll = {
  id: string;
  title: string;
  /** 마감 시각. null이면 마감 없음. */
  closesAt: Date | null;
  /** DB 시각 기준으로 마감 시각이 지났는지 */
  isClosed: boolean;
  options: Option[];
};
export type PollListItem = { id: string; title: string; participated: boolean };
export type AdminPollListItem = { id: string; title: string; participationCount: number };

export async function listPollsFor(voterId: string): Promise<PollListItem[]> {
  if (!isUuid(voterId)) return [];
  const rows = await sql`
    select p.id, p.title,
      exists (
        select 1 from participations pa
        where pa.poll_id = p.id and pa.voter_id = ${voterId}
      ) as participated
    from polls p
    order by p.created_at desc`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    participated: r.participated,
  }));
}

export async function listPollsForAdmin(): Promise<AdminPollListItem[]> {
  const rows = await sql`
    select p.id, p.title,
      (select count(*) from participations pa where pa.poll_id = p.id)::int as participation_count
    from polls p
    order by p.created_at desc`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    participationCount: r.participation_count,
  }));
}

export async function getPoll(id: string): Promise<Poll | null> {
  if (!isUuid(id)) return null;
  const [pollRows, optionRows] = await Promise.all([
    sql`
      select id, title, closes_at, (closes_at is not null and closes_at <= now()) as is_closed
      from polls where id = ${id}`,
    sql`select id, label, vote_count from options where poll_id = ${id} order by position`,
  ]);
  const poll = pollRows[0];
  if (!poll) return null;
  return {
    id: poll.id,
    title: poll.title,
    closesAt: poll.closes_at ? new Date(poll.closes_at) : null,
    isClosed: poll.is_closed,
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
        select 1 from options o join polls p on p.id = o.poll_id
        where o.id = ${optionId} and o.poll_id = ${pollId}
          and (p.closes_at is null or p.closes_at > now())
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
  const poll = await sql`
    select 1 from polls where id = ${pollId} and closes_at is not null and closes_at <= now()`;
  return poll.length > 0 ? "closed" : "gone";
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
  const closing = checkClosingTime(rawClosesAt, new Date());
  if (!closing.ok) return closing;
  const { title, options } = checked.value;
  const closesAt = closing.value?.toISOString() ?? null;
  const rows = await sql`
    with poll as (
      insert into polls (title, closes_at) values (${title}, ${closesAt}) returning id
    ), inserted as (
      insert into options (poll_id, label, position)
      select poll.id, o.label, o.position
      from poll, unnest(${options}::text[]) with ordinality as o(label, position)
    )
    select id from poll`;
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
