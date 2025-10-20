/**
 * 한글 초성 검색 유틸리티
 */

// 초성 리스트
const CHO = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 문자열에서 초성 추출
 */
export function getChosung(str: string): string {
  let result = '';
  
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    
    if (code > -1 && code < 11172) {
      // 한글인 경우
      result += CHO[Math.floor(code / 588)];
    } else {
      // 한글이 아닌 경우 그대로
      result += str.charAt(i);
    }
  }
  
  return result;
}

/**
 * 회사명 정규화 함수
 */
export function normalizeCompanyName(companyName: string): string {
  if (!companyName) return '';
  
  return companyName
    .toLowerCase()
    .replace(/[()（）]/g, '') // 괄호 제거
    .replace(/[주식회사|(주)|㈜]/g, '') // 주식회사 관련 텍스트 제거
    .replace(/[.,\s]+/g, '') // 점, 쉼표, 공백 제거
    .trim();
}

/**
 * 향상된 검색 매칭 함수
 */
export function matchesChosung(target: string, search: string): boolean {
  if (!search) return true;
  
  const searchLower = search.toLowerCase().trim();
  const targetLower = target.toLowerCase();
  
  // 1. 정확한 매칭 (정규화된 이름)
  const normalizedTarget = normalizeCompanyName(target);
  const normalizedSearch = normalizeCompanyName(search);
  
  if (normalizedTarget.includes(normalizedSearch) || normalizedSearch.includes(normalizedTarget)) {
    return true;
  }
  
  // 2. 초성으로 검색
  const targetChosung = getChosung(target).toLowerCase();
  const searchChosung = getChosung(search).toLowerCase();
  
  if (targetChosung.includes(searchChosung) || searchChosung.includes(targetChosung)) {
    return true;
  }
  
  // 3. 일반 텍스트로 검색 (부분 매칭)
  if (targetLower.includes(searchLower)) {
    return true;
  }
  
  // 4. 단어별 검색 (공백으로 분리된 단어들)
  const targetWords = targetLower.split(/\s+/);
  const searchWords = searchLower.split(/\s+/);
  
  for (const searchWord of searchWords) {
    for (const targetWord of targetWords) {
      if (targetWord.includes(searchWord) || searchWord.includes(targetWord)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 검색 점수 계산 (정확도 순으로 정렬용)
 */
export function getSearchScore(target: string, search: string): number {
  if (!search) return 0;
  
  const searchLower = search.toLowerCase().trim();
  const targetLower = target.toLowerCase();
  
  // 정확한 매칭
  if (targetLower === searchLower) return 100;
  
  // 정규화된 정확한 매칭
  const normalizedTarget = normalizeCompanyName(target);
  const normalizedSearch = normalizeCompanyName(search);
  if (normalizedTarget === normalizedSearch) return 95;
  
  // 시작 부분 매칭
  if (targetLower.startsWith(searchLower)) return 90;
  if (normalizedTarget.startsWith(normalizedSearch)) return 85;
  
  // 포함 매칭
  if (targetLower.includes(searchLower)) return 80;
  if (normalizedTarget.includes(normalizedSearch)) return 75;
  
  // 초성 매칭
  const targetChosung = getChosung(target).toLowerCase();
  const searchChosung = getChosung(search).toLowerCase();
  if (targetChosung.includes(searchChosung)) return 60;
  
  // 단어별 매칭
  const targetWords = targetLower.split(/\s+/);
  const searchWords = searchLower.split(/\s+/);
  
  for (const searchWord of searchWords) {
    for (const targetWord of targetWords) {
      if (targetWord.includes(searchWord)) return 50;
    }
  }
  
  return 0;
}
