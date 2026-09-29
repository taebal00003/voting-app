import { isUuid, sql } from "./db";
import type { PollDraft } from "./rules";

export type Option = { id: string; label: string; voteCount: number };
export type Poll = { id: string; title: string; createdAt: Date; options: Option[] };
export type PollListItem = { id: string; title: string; createdAt: Date; participated: boolean };
export type AdminPollListItem = {
  id: string;
  title: string;
  createdAt: Date;
  participantCount: number;
};

export async function listPollsFor(voterId: string): Promise<PollListItem[]> {
  const rows = await sql`
    select p.id, p.title, p.created_at,
      exists (
        select 1 from participations pa
        where pa.poll_id = p.id and pa.voter_id = ${voterId}
      ) as participated
    from polls p
    order by p.created_at desc`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    participated: r.participated,
  }));
}

export async function listPollsForAdmin(): Promise<AdminPollListItem[]> {
  const rows = await sql`
    select p.id, p.title, p.created_at,
      (select count(*) from participations pa where pa.poll_id = p.id)::int as participant_count
    from polls p
    order by p.created_at desc`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    participantCount: r.participant_count,
  }));
}

export async function getPoll(id: string): Promise<Poll | null> {
  if (!isUuid(id)) return null;
  const [pollRows, optionRows] = await Promise.all([
    sql`select id, title, created_at from polls where id = ${id}`,
    sql`select id, label, vote_count from options where poll_id = ${id} order by position`,
  ]);
  const poll = pollRows[0];
  if (!poll) return null;
  return {
    id: poll.id,
    title: poll.title,
    createdAt: poll.created_at,
    options: optionRows.map((o) => ({ id: o.id, label: o.label, voteCount: o.vote_count })),
  };
}

export async function hasParticipated(pollId: string, voterId: string): Promise<boolean> {
  const rows = await sql`
    select 1 from participations where poll_id = ${pollId} and voter_id = ${voterId}`;
  return rows.length > 0;
}

export type CastResult = "ok" | "already" | "gone";

/**
 * 참여 기록 추가와 선택지 개수 증가를 한 SQL 문으로 처리해 둘 중 하나만 남는 일이 없게 한다.
 * 누가 무엇을 골랐는지는 어디에도 기록하지 않는다 (docs/adr/0002).
 */
export async function castVote(
  pollId: string,
  optionId: string,
  voterId: string,
): Promise<CastResult> {
  if (!isUuid(pollId) || !isUuid(optionId)) return "gone";
  const rows = await sql`
    with participation as (
      insert into participations (poll_id, voter_id)
      select ${pollId}::uuid, ${voterId}::uuid
      where exists (select 1 from options where id = ${optionId} and poll_id = ${pollId})
      on conflict do nothing
      returning 1
    )
    update options set vote_count = vote_count + 1
    where id = ${optionId} and poll_id = ${pollId}
      and exists (select 1 from participation)
    returning id`;
  if (rows.length > 0) return "ok";
  return (await hasParticipated(pollId, voterId)) ? "already" : "gone";
}

export async function createPoll(draft: PollDraft): Promise<string> {
  const rows = await sql`
    with poll as (
      insert into polls (title) values (${draft.title}) returning id
    ), inserted as (
      insert into options (poll_id, label, position)
      select poll.id, o.label, o.position
      from poll, unnest(${draft.options}::text[]) with ordinality as o(label, position)
    )
    select id from poll`;
  return rows[0].id;
}

export async function deletePoll(id: string): Promise<void> {
  if (!isUuid(id)) return;
  await sql`delete from polls where id = ${id}`;
}

export type Turnout = { participated: string[]; notYet: string[] };

/** 명부 기준 참여/미참여 이름. 이름순으로만 돌려주어 참여 순서가 드러나지 않게 한다. */
export async function getTurnout(pollId: string): Promise<Turnout> {
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
