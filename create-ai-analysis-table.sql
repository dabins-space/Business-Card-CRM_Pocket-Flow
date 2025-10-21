-- AI 분석 히스토리 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하여 ai_analysis_history 테이블을 생성하세요

-- 1. ai_analysis_history 테이블 생성
CREATE TABLE IF NOT EXISTS ai_analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_company_name ON ai_analysis_history(company_name);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_created_at ON ai_analysis_history(created_at DESC);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 (모든 사용자가 조회/저장 가능)
CREATE POLICY "Anyone can view AI analysis history" ON ai_analysis_history
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert AI analysis history" ON ai_analysis_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update AI analysis history" ON ai_analysis_history
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete AI analysis history" ON ai_analysis_history
  FOR DELETE USING (true);

-- 5. updated_at 자동 업데이트를 위한 트리거 함수 (이미 존재할 수 있음)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 생성
CREATE TRIGGER update_ai_analysis_history_updated_at
  BEFORE UPDATE ON ai_analysis_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 테이블 코멘트 추가
COMMENT ON TABLE ai_analysis_history IS 'AI 분석 결과 히스토리 저장 테이블';
COMMENT ON COLUMN ai_analysis_history.company_name IS '분석 대상 회사명';
COMMENT ON COLUMN ai_analysis_history.analysis_data IS 'AI 분석 결과 JSON 데이터';
COMMENT ON COLUMN ai_analysis_history.created_at IS '분석 생성 시간';
COMMENT ON COLUMN ai_analysis_history.updated_at IS '분석 수정 시간';

-- 8. 테이블 생성 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ai_analysis_history'
    ) 
    THEN '✅ ai_analysis_history 테이블이 성공적으로 생성되었습니다!' 
    ELSE '❌ ai_analysis_history 테이블 생성에 실패했습니다' 
  END as result;

-- 9. 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'ai_analysis_history'
ORDER BY ordinal_position;
