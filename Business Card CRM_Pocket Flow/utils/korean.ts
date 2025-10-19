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
 * 초성 매칭 검색
 */
export function matchesChosung(target: string, search: string): boolean {
  if (!search) return true;
  
  const targetChosung = getChosung(target).toLowerCase();
  const searchLower = search.toLowerCase();
  
  // 초성으로 검색
  if (targetChosung.includes(searchLower)) {
    return true;
  }
  
  // 일반 텍스트로 검색
  if (target.toLowerCase().includes(searchLower)) {
    return true;
  }
  
  return false;
}
