-- AI 분석 데이터 구조 확인 스크립트
-- Supabase SQL Editor에서 실행하여 현재 저장된 데이터 구조를 확인하세요

-- 1. 최근 AI 분석 데이터 5개 조회
SELECT 
  id,
  company_name,
  created_at,
  analysis_data
FROM ai_analysis_history 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. analysis_data의 키 구조 확인 (PostgreSQL JSONB 함수 사용)
SELECT 
  company_name,
  jsonb_object_keys(analysis_data) as data_keys
FROM ai_analysis_history 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. 특정 회사의 최신 분석 데이터 상세 조회
SELECT 
  company_name,
  analysis_data->'company' as company,
  analysis_data->'overview' as overview,
  analysis_data->'industry' as industry,
  analysis_data->'solutions' as solutions,
  analysis_data->'recentNews' as recent_news,
  analysis_data->'proposalPoints' as proposal_points,
  analysis_data->'sources' as sources
FROM ai_analysis_history 
WHERE company_name IS NOT NULL
ORDER BY created_at DESC 
LIMIT 3;

-- 4. recentNews 필드가 있는 데이터 확인
SELECT 
  company_name,
  analysis_data->'recentNews' as recent_news,
  created_at
FROM ai_analysis_history 
WHERE analysis_data ? 'recentNews'
ORDER BY created_at DESC 
LIMIT 5;

-- 5. proposalPoints 필드가 있는 데이터 확인
SELECT 
  company_name,
  analysis_data->'proposalPoints' as proposal_points,
  created_at
FROM ai_analysis_history 
WHERE analysis_data ? 'proposalPoints'
ORDER BY created_at DESC 
LIMIT 5;
