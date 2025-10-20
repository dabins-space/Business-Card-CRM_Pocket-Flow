-- 연락처 히스토리 테이블 생성 스크립트
-- 메모 변경, 정보 수정 등의 히스토리를 추적합니다.

-- 1. 연락처 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'memo_add', 'memo_edit', 'info_update', 'ai_analysis'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  old_value TEXT, -- 변경 전 값 (선택적)
  new_value TEXT, -- 변경 후 값 (선택적)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system' -- 사용자 식별자 (향후 확장용)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contact_history_contact_id ON contact_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_created_at ON contact_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_history_action_type ON contact_history(action_type);

-- 3. RLS 활성화
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
DROP POLICY IF EXISTS "Anyone can view contact history" ON public.contact_history;
DROP POLICY IF EXISTS "Anyone can insert contact history" ON public.contact_history;

CREATE POLICY "Anyone can view contact history" ON contact_history
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert contact history" ON contact_history
  FOR INSERT WITH CHECK (true);

-- 5. 업데이트 트리거 함수 (이미 있다면 무시)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 완료 메시지
SELECT 'Contact History table created successfully!' as message;
