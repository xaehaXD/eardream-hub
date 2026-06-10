-- =============================================================
-- posts 테이블 UPDATE RLS 정책 추가
-- =============================================================
-- 문제: posts 테이블에 RLS는 켜져 있으나 UPDATE 정책이 없어서
--       익명 사용자의 수정(UPDATE)이 "에러 없이 0 rows"로 조용히 차단됨.
--       (SELECT/INSERT는 동작하지만 UPDATE만 막혀 수정 기능이 실패)
--
-- 해결: 익명 사용자가 posts를 UPDATE 할 수 있는 정책 추가.
--       현재 서비스는 로그인이 없으므로 public(anon) 에게 허용.
--       비밀번호 검증은 프론트엔드에서 수행됨.
--
-- 주의: 기존 데이터는 절대 건드리지 않음. 테이블 drop/reset 하지 않음.
-- =============================================================

-- 1. RLS 활성화 상태 확인 (이미 켜져 있어도 안전)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. 기존 동일 정책이 있으면 삭제 (재실행 안전)
DROP POLICY IF EXISTS "Allow public update posts" ON public.posts;

-- 3. UPDATE 정책 추가 (익명 사용자 수정 허용)
CREATE POLICY "Allow public update posts"
ON public.posts
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- =============================================================
-- 참고: 현재 posts 테이블에 적용된 정책을 확인하려면 아래 실행
-- =============================================================
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'posts';
--
-- SELECT / INSERT / UPDATE 정책이 모두 존재해야 함.
-- (SELECT, INSERT 정책이 없다면 아래도 함께 실행)
-- =============================================================

-- (선택) SELECT 정책이 없을 경우에만 추가
DROP POLICY IF EXISTS "Allow public read posts" ON public.posts;
CREATE POLICY "Allow public read posts"
ON public.posts
FOR SELECT
TO public
USING (true);

-- (선택) INSERT 정책이 없을 경우에만 추가
DROP POLICY IF EXISTS "Allow public insert posts" ON public.posts;
CREATE POLICY "Allow public insert posts"
ON public.posts
FOR INSERT
TO public
WITH CHECK (true);

-- =============================================================
-- 정책 추가 후 Supabase schema/policy cache 갱신이 필요할 수 있음.
-- 잠시 후 다시 시도하거나 프로젝트를 재배포하면 즉시 반영됨.
-- =============================================================
