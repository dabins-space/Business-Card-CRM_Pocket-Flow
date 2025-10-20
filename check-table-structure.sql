-- 현재 테이블 구조 확인 스크립트
-- 이 스크립트를 먼저 실행해서 현재 상태를 확인하세요

-- 1. contacts 테이블이 존재하는지 확인
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'contacts'
) as contacts_table_exists;

-- 2. contacts 테이블의 컬럼 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'contacts'
ORDER BY ordinal_position;

-- 3. storage.buckets 테이블에서 business-cards 버킷 확인
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'business-cards';

-- 4. storage.objects 정책 확인
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 5. ai_analysis_history 테이블이 존재하는지 확인
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'ai_analysis_history'
) as ai_analysis_history_table_exists;

-- 6. ai_analysis_history 테이블의 컬럼 구조 확인 (테이블이 존재하는 경우에만)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'ai_analysis_history'
ORDER BY ordinal_position;