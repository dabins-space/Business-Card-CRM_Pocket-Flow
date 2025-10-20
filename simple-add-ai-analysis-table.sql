-- 간단한 AI 분석 히스토리 테이블 생성 스크립트
-- 문법 오류 없이 안전하게 실행됩니다

-- AI 분석 히스토리 테이블 생성 (IF NOT EXISTS 사용)
CREATE TABLE IF NOT EXISTS ai_analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 분석 히스토리 인덱스 생성 (IF NOT EXISTS 사용)
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_company_name ON ai_analysis_history(company_name);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_created_at ON ai_analysis_history(created_at DESC);

-- AI 분석 히스토리 RLS 활성화
ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 삭제 후 재생성
DROP POLICY IF EXISTS "Anyone can view AI analysis history" ON ai_analysis_history;
DROP POLICY IF EXISTS "Anyone can insert AI analysis history" ON ai_analysis_history;

-- AI 분석 히스토리 RLS 정책 생성
CREATE POLICY "Anyone can view AI analysis history" ON ai_analysis_history
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert AI analysis history" ON ai_analysis_history
  FOR INSERT WITH CHECK (true);

-- 업데이트 트리거 함수 생성 (기존 함수가 있어도 덮어씀)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS update_ai_analysis_history_updated_at ON ai_analysis_history;

-- AI 분석 히스토리 업데이트 트리거 생성
CREATE TRIGGER update_ai_analysis_history_updated_at
  BEFORE UPDATE ON ai_analysis_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
SELECT 'AI Analysis History table created successfully!' as message;
