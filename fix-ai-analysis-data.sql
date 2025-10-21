-- AI 분석 데이터 정리 스크립트
-- 기존 데이터의 구조를 새로운 형식에 맞게 수정합니다

-- 1. 기존 데이터 확인
SELECT 
  id,
  company_name,
  jsonb_object_keys(analysis_data) as existing_keys,
  created_at
FROM ai_analysis_history 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. recentNews 필드가 없는 데이터에 빈 배열 추가
UPDATE ai_analysis_history 
SET analysis_data = analysis_data || '{"recentNews": []}'::jsonb
WHERE NOT (analysis_data ? 'recentNews');

-- 3. sources 필드가 없는 데이터에 빈 배열 추가
UPDATE ai_analysis_history 
SET analysis_data = analysis_data || '{"sources": []}'::jsonb
WHERE NOT (analysis_data ? 'sources');

-- 4. sourceDetails 필드가 없는 데이터에 기본값 추가
UPDATE ai_analysis_history 
SET analysis_data = analysis_data || '{"sourceDetails": {"overview": "정보가 제한적", "industry": "정보가 제한적", "employees": "정보가 제한적", "founded": "정보가 제한적"}}'::jsonb
WHERE NOT (analysis_data ? 'sourceDetails');

-- 5. solutions 필드가 없는 데이터에 빈 배열 추가
UPDATE ai_analysis_history 
SET analysis_data = analysis_data || '{"solutions": []}'::jsonb
WHERE NOT (analysis_data ? 'solutions');

-- 6. proposalPoints 필드가 없는 데이터에 빈 배열 추가
UPDATE ai_analysis_history 
SET analysis_data = analysis_data || '{"proposalPoints": []}'::jsonb
WHERE NOT (analysis_data ? 'proposalPoints');

-- 7. 수정된 데이터 확인
SELECT 
  id,
  company_name,
  analysis_data->'recentNews' as recent_news,
  analysis_data->'sources' as sources,
  analysis_data->'solutions' as solutions,
  analysis_data->'proposalPoints' as proposal_points,
  created_at
FROM ai_analysis_history 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. 완료 메시지
SELECT 'AI analysis data structure updated successfully!' as message;
