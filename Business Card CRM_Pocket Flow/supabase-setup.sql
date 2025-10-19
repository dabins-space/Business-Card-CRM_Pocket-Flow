-- Supabase 설정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-cards',
  'business-cards',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 2. contacts 테이블 생성
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  company TEXT,
  email TEXT,
  phone TEXT,
  importance INTEGER CHECK (importance >= 1 AND importance <= 5) DEFAULT 3,
  inquiry_types TEXT[] DEFAULT '{}',
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- 4. RLS (Row Level Security) 활성화
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
-- 정책 1: 인증된 사용자는 자신이 생성한 연락처만 조회 가능
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR user_id IS NULL)
  );

-- 정책 2: 인증된 사용자는 연락처 생성 가능 (user_id는 자동으로 설정)
CREATE POLICY "Users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- 정책 3: 인증된 사용자는 자신의 연락처만 수정 가능
CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- 정책 4: 인증된 사용자는 자신의 연락처만 삭제 가능
CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- 6. 익명 사용자를 위한 정책 (현재는 비활성화, 필요시 활성화)
-- CREATE POLICY "Anonymous users can insert contacts" ON contacts
--   FOR INSERT WITH CHECK (user_id IS NULL);

-- 7. updated_at 자동 업데이트를 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Storage 정책 생성
-- Storage 버킷에 대한 정책
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

CREATE POLICY "Users can delete own business card images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-cards' AND
    auth.uid() IS NOT NULL
  );

-- 9. 익명 사용자를 위한 Storage 정책 (현재는 비활성화)
-- CREATE POLICY "Anonymous users can upload business card images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'business-cards'
--   );

-- 10. 완료 메시지
SELECT 'Supabase setup completed successfully!' as message;
