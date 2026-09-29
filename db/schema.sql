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

-- 진행 중 / 마감됨 판정은 여기 한 곳에서만 한다. DB 시각(now()) 기준이다.
-- 투표할 때마다 읽으므로 가볍게 둔다.
-- 열 구성이 바뀌어도 다시 만들 수 있게 두 뷰를 지우고 만든다. poll_list_order가 poll_states를 읽으므로 먼저 지운다.
drop view if exists poll_list_order;
drop view if exists poll_states;
create view poll_states as
  select id, (closes_at is not null and closes_at <= now()) as is_closed from polls;

-- 목록 순서: 진행 중이면서 마감 있음(마감 가까운 순) → 진행 중이면서 마감 없음(최신순)
--          → 마감됨(최근에 마감된 순). 목록을 보여줄 때만 읽는다.
create view poll_list_order as
  select p.id,
    row_number() over (
      order by
        s.is_closed,
        p.closes_at is null,
        case when not s.is_closed then p.closes_at end asc,
        case when s.is_closed then p.closes_at end desc,
        p.created_at desc,
        p.id
    ) as list_position
  from polls p join poll_states s using (id);

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
