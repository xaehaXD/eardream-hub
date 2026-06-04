-- ============================================
-- feedbacks 테이블 생성 (Supabase SQL Editor에서 실행)
-- 기존 posts 테이블은 건드리지 않음
-- ============================================

-- 1. feedbacks 테이블 생성
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL CHECK (char_length(nickname) >= 1 AND char_length(nickname) <= 50),
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. 인덱스 생성 (post_id로 빠르게 조회)
CREATE INDEX IF NOT EXISTS feedbacks_post_id_idx ON public.feedbacks(post_id);

-- 3. created_at 기준 정렬용 인덱스
CREATE INDEX IF NOT EXISTS feedbacks_created_at_idx ON public.feedbacks(created_at);

-- 4. RLS 활성화
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 5. 기존 정책 삭제 (있으면)
DROP POLICY IF EXISTS "Allow public read feedbacks" ON public.feedbacks;
DROP POLICY IF EXISTS "Allow anonymous insert feedbacks" ON public.feedbacks;

-- 6. Public Read 정책 (누구나 피드백 조회 가능)
CREATE POLICY "Allow public read feedbacks"
ON public.feedbacks
FOR SELECT
TO public
USING (true);

-- 7. Anonymous Insert 정책 (로그인 없이 피드백 작성 가능)
CREATE POLICY "Allow anonymous insert feedbacks"
ON public.feedbacks
FOR INSERT
TO public
WITH CHECK (
  char_length(nickname) >= 1 AND char_length(nickname) <= 50
  AND char_length(content) >= 1 AND char_length(content) <= 1000
);

-- UPDATE, DELETE 정책은 추가하지 않음 (허용하지 않음)
