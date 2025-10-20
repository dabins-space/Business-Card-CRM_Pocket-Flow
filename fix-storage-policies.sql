-- Storage 정책 수정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 기존 Storage 정책들 모두 삭제
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload business card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own business card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own business card images" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload business card images" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can view uploaded images" ON storage.objects;

-- 2. business-cards 버킷이 없으면 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-cards',
  'business-cards',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. 새로운 Storage 정책 생성

-- 인증된 사용자 정책
CREATE POLICY "Users can upload business card images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-cards' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own business card images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'business-cards' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update own business card images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business-cards' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own business card images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-cards' AND
    auth.uid() IS NOT NULL
  );

-- 익명 사용자 정책
CREATE POLICY "Anonymous users can upload business card images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-cards'
  );

CREATE POLICY "Anonymous users can view uploaded images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'business-cards'
  );

-- 4. 완료 메시지
SELECT 'Storage policies updated successfully!' as message;
