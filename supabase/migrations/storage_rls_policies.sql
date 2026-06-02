-- ============================================
-- Supabase Storage RLS 정책 설정
-- 버킷: posts
-- ============================================
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

-- 1. 기존 정책이 있으면 삭제 (에러 무시)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;

-- 2. Public Read 정책 (누구나 이미지 조회 가능)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'posts');

-- 3. Anonymous Upload 정책 (로그인 없이 업로드 가능)
CREATE POLICY "Allow anonymous uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'posts');

-- ============================================
-- 확인용 쿼리 (정책 적용 확인)
-- ============================================
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
