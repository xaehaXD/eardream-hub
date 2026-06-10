-- ============================================================
-- Supabase Storage RLS 정책 (posts 버킷, poster-images/ 경로만 허용)
-- ============================================================
-- 실행 전: Supabase Dashboard > Storage > posts 버킷이 생성되어 있어야 함
-- 실행 방법: Supabase Dashboard > SQL Editor > New Query > 붙여넣기 > Run
-- ============================================================

-- 1. 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read for posts bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous upload to poster-images" ON storage.objects;

-- 2. Public Read 정책
-- 누구나 posts 버킷의 모든 파일을 조회할 수 있음
CREATE POLICY "Allow public read for posts bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'posts');

-- 3. Anonymous Upload 정책 (poster-images/ 경로만 허용)
-- 로그인 없이 poster-images/ 폴더에만 업로드 가능
-- storage.foldername(name) 함수로 경로 검증
CREATE POLICY "Allow anonymous upload to poster-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = 'poster-images'
);

-- ============================================================
-- 참고: DELETE, UPDATE 정책은 추가하지 않음 (기본 거부)
-- ============================================================

-- 확인용 쿼리 (정책 적용 확인)
-- SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'objects';
