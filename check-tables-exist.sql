-- 테이블 존재 여부 확인 스크립트
-- Supabase SQL Editor에서 실행하여 테이블들이 실제로 존재하는지 확인하세요

-- 1. 모든 테이블 목록 확인
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. ai_analysis_history 테이블 존재 여부 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ai_analysis_history'
    ) 
    THEN 'ai_analysis_history 테이블이 존재합니다' 
    ELSE 'ai_analysis_history 테이블이 존재하지 않습니다' 
  END as table_status;

-- 3. contacts 테이블 존재 여부 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'contacts'
    ) 
    THEN 'contacts 테이블이 존재합니다' 
    ELSE 'contacts 테이블이 존재하지 않습니다' 
  END as table_status;

-- 4. ai_analysis_history 테이블 구조 확인 (테이블이 존재하는 경우)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'ai_analysis_history'
ORDER BY ordinal_position;

-- 5. ai_analysis_history 테이블의 데이터 개수 확인 (테이블이 존재하는 경우)
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT company_name) as unique_companies
FROM ai_analysis_history;

-- 6. 최근 AI 분석 데이터 3개 확인 (테이블이 존재하는 경우)
SELECT 
  id,
  company_name,
  created_at,
  jsonb_object_keys(analysis_data) as data_keys
FROM ai_analysis_history 
ORDER BY created_at DESC 
LIMIT 3;
