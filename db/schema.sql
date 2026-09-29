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
