-- AI 분석 히스토리 테이블만 추가하는 스크립트
-- 기존 Supabase 프로젝트에 AI 분석 히스토리 기능을 추가할 때 사용

-- AI 분석 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS ai_analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 분석 히스토리 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_company_name ON ai_analysis_history(company_name);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_created_at ON ai_analysis_history(created_at DESC);

-- AI 분석 히스토리 RLS 활성화
ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- AI 분석 히스토리 RLS 정책 (모든 사용자가 조회/저장 가능)
CREATE POLICY "Anyone can view AI analysis history" ON ai_analysis_history
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert AI analysis history" ON ai_analysis_history
  FOR INSERT WITH CHECK (true);

-- AI 분석 히스토리 업데이트 트리거 (기존 함수가 있다면 재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_analysis_history_updated_at
  BEFORE UPDATE ON ai_analysis_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
SELECT 'AI Analysis History table created successfully!' as message;
