-- 이어드림 허브 VER2: post_reactions + post_share_events 테이블 생성
-- Supabase SQL Editor에서 그대로 실행하세요.
-- 기존 데이터(posts, feedbacks)는 절대 변경/삭제하지 않습니다.

-- =========================================================
-- 1. post_reactions (따봉 업보트)
-- =========================================================
create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  reaction_type text not null default 'upvote',
  fingerprint text not null,
  created_at timestamptz default now()
);

-- 같은 visitor_id가 같은 post에 중복 반응 못하게 (insert .. on conflict 로 무시)
create unique index if not exists unique_post_reaction
on post_reactions (post_id, fingerprint, reaction_type);

alter table post_reactions enable row level security;

drop policy if exists "Anyone can read post reactions" on post_reactions;
create policy "Anyone can read post reactions"
on post_reactions
for select
to anon
using (true);

drop policy if exists "Anyone can insert post reactions" on post_reactions;
create policy "Anyone can insert post reactions"
on post_reactions
for insert
to anon
with check (true);

-- =========================================================
-- 2. post_share_events (공유 행동 로그 - 운영 분석용)
-- =========================================================
create table if not exists post_share_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  share_target text not null default 'copy',
  fingerprint text,
  created_at timestamptz default now()
);

alter table post_share_events enable row level security;

drop policy if exists "Anyone can insert post share events" on post_share_events;
create policy "Anyone can insert post share events"
on post_share_events
for insert
to anon
with check (true);

-- =========================================================
-- 3. 카테고리 컬럼 참고
-- =========================================================
-- posts.category 는 text 타입이므로 '공유할래'(코드값: share) 추가에
-- 별도의 DB migration 이 필요 없습니다. (프론트 상수만 추가)
