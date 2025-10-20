-- AI 분석 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS ai_analysis_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_company_name ON ai_analysis_history(company_name);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_history_created_at ON ai_analysis_history(created_at DESC);

-- RLS (Row Level Security) 정책 설정 (필요한 경우)
-- ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- 업데이트 시간 자동 갱신을 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_ai_analysis_history_updated_at 
    BEFORE UPDATE ON ai_analysis_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 테이블 코멘트 추가
COMMENT ON TABLE ai_analysis_history IS 'AI 분석 결과 히스토리 저장 테이블';
COMMENT ON COLUMN ai_analysis_history.company_name IS '분석 대상 회사명';
COMMENT ON COLUMN ai_analysis_history.analysis_data IS 'AI 분석 결과 JSON 데이터';
COMMENT ON COLUMN ai_analysis_history.created_at IS '분석 생성 시간';
COMMENT ON COLUMN ai_analysis_history.updated_at IS '분석 수정 시간';
