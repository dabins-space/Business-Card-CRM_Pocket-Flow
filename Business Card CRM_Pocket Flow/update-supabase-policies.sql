-- 익명 사용자를 위한 정책 추가
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 익명 사용자를 위한 contacts 테이블 정책
CREATE POLICY "Anonymous users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (user_id IS NULL);

-- 2. 익명 사용자를 위한 Storage 정책
CREATE POLICY "Anonymous users can upload business card images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-cards'
  );

-- 3. 익명 사용자가 업로드한 이미지를 조회할 수 있는 정책
CREATE POLICY "Anonymous users can view uploaded images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'business-cards'
  );

SELECT 'Anonymous user policies added successfully!' as message;
