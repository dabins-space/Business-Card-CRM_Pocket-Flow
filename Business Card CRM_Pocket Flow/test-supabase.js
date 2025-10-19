// Supabase 연결 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');

// 환경 변수에서 설정 읽기
const supabaseUrl = 'https://qmyyyxkpemdjuwtimwsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFteXl5eGtwZW1kanV3dGltd3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NTc3MDksImV4cCI6MjA3NjIzMzcwOX0.yF7F1ioubJxcOLmK92rwmXoiZo559pkAdi_6k5dYz10';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Supabase 연결 테스트 시작...');
    
    // 1. 기본 연결 테스트
    console.log('1. 기본 연결 테스트...');
    const { data, error } = await supabase.from('contacts').select('count').limit(1);
    
    if (error) {
      console.error('❌ 연결 오류:', error.message);
      return;
    }
    
    console.log('✅ Supabase 연결 성공!');
    
    // 2. 테이블 존재 확인
    console.log('2. contacts 테이블 확인...');
    const { data: tableData, error: tableError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ 테이블 접근 오류:', tableError.message);
      return;
    }
    
    console.log('✅ contacts 테이블 접근 성공!');
    
    // 3. Storage 버킷 확인
    console.log('3. Storage 버킷 확인...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Storage 접근 오류:', bucketError.message);
      return;
    }
    
    const businessCardsBucket = buckets.find(bucket => bucket.name === 'cards');
    if (businessCardsBucket) {
      console.log('✅ Storage 버킷 "cards" 확인됨!');
    } else {
      console.log('⚠️  Storage 버킷 "cards"가 없습니다. 생성이 필요할 수 있습니다.');
    }
    
    console.log('\n🎉 모든 테스트 통과! Supabase가 정상적으로 설정되었습니다.');
    
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err.message);
  }
}

testConnection();
