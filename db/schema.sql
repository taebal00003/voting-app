-- 투표자 명부. 명부에서 빠진 투표자는 removed_at이 채워지고 code가 지워진다.
create table if not exists voters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  removed_at timestamptz
);
create unique index if not exists voters_active_name on voters (name) where removed_at is null;

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);
-- 마감 시각. null이면 마감 없음(삭제될 때까지 진행).
alter table polls add column if not exists closes_at timestamptz;

-- 진행 중 / 마감됨 판정과 목록 순서는 여기 한 곳에서만 정한다. DB 시각(now()) 기준이다.
-- 목록 순서: 진행 중이면서 마감 있음(마감 가까운 순) → 진행 중이면서 마감 없음(최신순)
--          → 마감됨(최근에 마감된 순).
create or replace view poll_states as
  select id, is_closed,
    row_number() over (
      order by
        is_closed,
        closes_at is null,
        case when not is_closed then closes_at end asc,
        case when is_closed then closes_at end desc,
        created_at desc
    ) as list_position
  from (
    select id, closes_at, created_at, (closes_at is not null and closes_at <= now()) as is_closed
    from polls
  ) p;

-- 비밀 투표: 투표 행위는 개별 행 없이 선택지별 개수로만 남는다 (docs/adr/0002).
create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls (id) on delete cascade,
  label text not null,
  position int not null,
  vote_count int not null default 0,
  unique (poll_id, position),
  unique (poll_id, label)
);

-- 참여 기록: 누가 참여했는지만 담고, 무엇을 골랐는지는 담지 않는다.
create table if not exists participations (
  poll_id uuid not null references polls (id) on delete cascade,
  voter_id uuid not null references voters (id),
  primary key (poll_id, voter_id)
);
