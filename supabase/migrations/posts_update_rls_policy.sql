-- =============================================================================
-- SECURE POSTS UPDATE — RLS POLICY
-- =============================================================================
-- 게시물 수정/마감은 서버 액션(app/actions/posts.ts)에서 service role 키로
-- 처리합니다. service role은 RLS를 우회하므로, posts 테이블에 public UPDATE
-- 정책을 만들 필요가 없습니다 (보안상 만들면 안 됩니다).
--
-- 즉, 익명(anon) 클라이언트에게는:
--   - SELECT: 허용 (누구나 게시물 조회)
--   - INSERT: 허용 (누구나 게시물 작성)
--   - UPDATE: 정책 없음 → 익명 클라이언트는 직접 수정 불가
--   - DELETE: 정책 없음 → 삭제 불가
-- 수정/마감은 오직 서버(service role)에서, 비밀번호 검증 통과 후에만 수행됩니다.
--
-- 기존 데이터는 절대 건드리지 않습니다. (DROP TABLE/DELETE/TRUNCATE 없음)
-- =============================================================================

-- 1. RLS 활성화 보장 (이미 켜져 있으면 변화 없음)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 2. 이전 단계에서 실수로 추가했을 수 있는 광범위한 public UPDATE 정책 제거.
--    이것이 이 마이그레이션의 핵심입니다. 아무나 수정할 수 있는 구멍을 막습니다.
DROP POLICY IF EXISTS "Allow public update posts" ON public.posts;

-- 3. 읽기/생성 정책은 유지 (없으면 추가). 재실행해도 안전합니다.
DROP POLICY IF EXISTS "Allow public read posts" ON public.posts;
CREATE POLICY "Allow public read posts"
ON public.posts
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow public insert posts" ON public.posts;
CREATE POLICY "Allow public insert posts"
ON public.posts
FOR INSERT
TO public
WITH CHECK (true);

-- =============================================================================
-- 확인용: 적용된 정책 목록 (UPDATE 정책이 없어야 정상)
-- =============================================================================
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'posts';
--   → SELECT, INSERT 정책만 보이고 UPDATE 정책은 없어야 합니다.
-- =============================================================================
