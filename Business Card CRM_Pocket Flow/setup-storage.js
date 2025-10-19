// Storage 버킷 생성 스크립트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qmyyyxkpemdjuwtimwsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteXl5eGtwZW1kanV3dGltd3N2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY1NzcwOSwiZXhwIjoyMDc2MjMzNzA5fQ.VHrfHNW2tPWc90jIw4eyLNxk1ZSasm7WxfHAR0XEIM4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log('🔧 Storage 버킷 설정 시작...');
    
    // 1. 기존 버킷 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ 버킷 목록 조회 오류:', listError.message);
      return;
    }
    
    console.log('현재 버킷 목록:', buckets.map(b => b.name));
    
    // 2. cards 버킷이 없으면 생성
    const cardsBucket = buckets.find(bucket => bucket.name === 'cards');
    
    if (!cardsBucket) {
      console.log('📦 "cards" 버킷 생성 중...');
      
      const { data, error } = await supabase.storage.createBucket('cards', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (error) {
        console.error('❌ 버킷 생성 오류:', error.message);
        return;
      }
      
      console.log('✅ "cards" 버킷 생성 완료!');
    } else {
      console.log('✅ "cards" 버킷이 이미 존재합니다.');
    }
    
    // 3. Storage 정책 설정 (SQL로 직접 실행 필요)
    console.log('\n📋 Storage 정책을 설정하려면 Supabase 대시보드에서 다음 SQL을 실행하세요:');
    console.log(`
-- Storage 정책 생성
CREATE POLICY "Users can upload business card images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cards' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own business card images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cards' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own business card images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cards' AND
    auth.uid() IS NOT NULL
  );
    `);
    
    console.log('\n🎉 Storage 설정 완료!');
    
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err.message);
  }
}

setupStorage();
