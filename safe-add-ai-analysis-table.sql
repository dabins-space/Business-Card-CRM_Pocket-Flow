-- 안전한 AI 분석 히스토리 테이블 생성 스크립트
-- 이미 테이블이 있어도 오류가 발생하지 않습니다

-- 1. 먼저 테이블이 존재하는지 확인
DO $$
BEGIN
    -- ai_analysis_history 테이블이 존재하지 않는 경우에만 생성
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_analysis_history') THEN
        
        -- AI 분석 히스토리 테이블 생성
        CREATE TABLE ai_analysis_history (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          company_name TEXT NOT NULL,
          analysis_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- AI 분석 히스토리 인덱스 생성
        CREATE INDEX idx_ai_analysis_history_company_name ON ai_analysis_history(company_name);
        CREATE INDEX idx_ai_analysis_history_created_at ON ai_analysis_history(created_at DESC);

        -- AI 분석 히스토리 RLS 활성화
        ALTER TABLE ai_analysis_history ENABLE ROW LEVEL SECURITY;

        -- AI 분석 히스토리 RLS 정책 생성
        CREATE POLICY "Anyone can view AI analysis history" ON ai_analysis_history
          FOR SELECT USING (true);

        CREATE POLICY "Anyone can insert AI analysis history" ON ai_analysis_history
          FOR INSERT WITH CHECK (true);

        -- 업데이트 트리거 함수가 없으면 생성
        IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ language 'plpgsql';
        END IF;

        -- AI 분석 히스토리 업데이트 트리거 생성
        CREATE TRIGGER update_ai_analysis_history_updated_at
          BEFORE UPDATE ON ai_analysis_history
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'AI Analysis History table created successfully!';
    ELSE
        RAISE NOTICE 'AI Analysis History table already exists. Skipping creation.';
    END IF;
END $$;

-- 2. 현재 상태 확인
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_analysis_history') 
        THEN 'AI Analysis History table exists' 
        ELSE 'AI Analysis History table does not exist' 
    END as table_status;
