// 웹 검색 및 기업 정보 수집 유틸리티

export interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
}

export interface CompanyWebInfo {
  website: string;
  searchResults: WebSearchResult[];
  companyInfo: string;
  pages: Array<{
    url: string;
    title: string;
    text: string;
  }>;
}

// 공용 이메일 도메인 목록
const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'yahoo.com', 'hotmail.com', 
  'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com'
];

/**
 * 공용 도메인인지 확인
 */
function isPublicDomain(domain: string): boolean {
  return PUBLIC_EMAIL_DOMAINS.some(publicDomain => domain.toLowerCase().includes(publicDomain));
}

/**
 * 공식 홈페이지인지 판별
 */
function isOfficial(url: string, companyName: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace('www.', '');
    const domainName = hostname.split('.')[0];
    
    // 회사명 정규화
    const normalizedCompanyName = companyName.toLowerCase()
      .replace(/[^가-힣a-z0-9]/g, '')
      .replace(/주식회사|\(주\)|\(사\)|회사|corp|inc|ltd|co\.|group|그룹/g, '');
    
    // 위키, 번역, 뉴스 사이트 제외
    const excludePatterns = ['wiki', 'translate', 'news', 'blog', 'forum', 'community'];
    if (excludePatterns.some(pattern => hostname.includes(pattern))) {
      return false;
    }
    
    // 도메인명이 회사명을 포함하는지 확인
    return domainName.includes(normalizedCompanyName) || normalizedCompanyName.includes(domainName);
  } catch {
    return false;
  }
}

/**
 * 웹페이지 본문 추출 (Readability 스타일)
 */
async function extractPageContent(url: string): Promise<{ title: string; text: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // 간단한 HTML 파싱
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // script, style 태그 제거하고 본문 추출
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      title,
      text: cleanHtml.substring(0, 2000) // 처음 2000자만
    };
  } catch (error) {
    console.error('Page extraction error:', error);
    return null;
  }
}

/**
 * SERP API를 사용한 뉴스 검색
 */
export async function searchCompanyNews(companyName: string): Promise<Array<{
  id: number;
  title: string;
  description: string;
  date: string;
  source: string;
  link: string;
}>> {
  const apiKey = process.env.SERP_API_KEY;
  
  if (!apiKey) {
    console.log('SERP_API_KEY not found, skipping news search');
    return [];
  }

  try {
    // 뉴스 검색 쿼리 (정확한 회사명 매칭)
    const newsQuery = `"${companyName}" 회사 뉴스`;
    const newsUrl = `https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(newsQuery)}&tbm=nws&num=15&gl=kr&hl=ko&sort=date`;
    
    console.log('Searching for company news:', companyName);
    console.log('News URL:', newsUrl);
    
    const response = await fetch(newsUrl);
    console.log('News response status:', response.status);
    
    if (!response.ok) {
      console.error('News API response not ok:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('News results:', data.news_results?.length || 0, 'results found');
    
    if (!data.news_results || data.news_results.length === 0) {
      return [];
    }

    // 뉴스 결과 필터링 (회사명이 제목이나 내용에 포함된 뉴스만 선택)
    const filteredNews = data.news_results.filter((news: any) => {
      const title = (news.title || '').toLowerCase();
      const description = (news.snippet || '').toLowerCase();
      const companyNameLower = companyName.toLowerCase();
      
      // 제목이나 내용에 회사명이 포함되어 있는지 확인
      return title.includes(companyNameLower) || description.includes(companyNameLower);
    });
    
    // 최신순으로 정렬하여 상위 3개 선택
    const sortedNews = filteredNews.sort((a: any, b: any) => {
      // 날짜가 있는 경우 최신순으로 정렬
      if (a.date && b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return 0;
    });
    
    const newsResults = sortedNews.slice(0, 3).map((news: any, index: number) => ({
      id: index + 1,
      title: news.title || '제목 없음',
      description: news.snippet || '내용 없음',
      date: news.date || '날짜 정보 없음',
      source: news.source || '출처 없음',
      link: news.link || '정보 없음'
    }));

    console.log('Processed news results:', newsResults);

    return newsResults;

  } catch (error) {
    console.error('News search error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

/**
 * SERP API를 사용한 웹 검색
 */
export async function searchCompanyInfo(companyName: string): Promise<CompanyWebInfo> {
  const apiKey = process.env.SERP_API_KEY;
  
  if (!apiKey) {
    console.log('SERP_API_KEY not found, skipping web search');
    return {
      website: '',
      searchResults: [],
      companyInfo: '웹 검색 정보 없음',
      pages: []
    };
  }

  try {
    // 회사명으로 검색
    const searchQuery = `"${companyName}" 공식 웹사이트 회사소개 사업분야`;
    const searchUrl = `https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(searchQuery)}&num=5&gl=kr&hl=ko`;
    
    console.log('Searching for company info:', companyName);
    console.log('Search URL:', searchUrl);
    
    const response = await fetch(searchUrl);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('SERP API response not ok:', response.status, response.statusText);
      return {
        website: '',
        searchResults: [],
        companyInfo: '웹 검색 API 오류',
        pages: []
      };
    }
    
    const data = await response.json();
    console.log('SERP API response:', JSON.stringify(data, null, 2));
    
    if (!data.organic_results || data.organic_results.length === 0) {
      return {
        website: '',
        searchResults: [],
        companyInfo: '웹 검색 결과 없음',
        pages: []
      };
    }

    // 검색 결과 처리
    const searchResults: WebSearchResult[] = data.organic_results.slice(0, 5).map((result: any) => ({
      url: result.link || '',
      title: result.title || '',
      snippet: result.snippet || ''
    }));

    // 공식 홈페이지 선택 (우선순위: isOfficial=true → 도메인 길이 짧은 순)
    const officialResults = searchResults.filter(result => isOfficial(result.url, companyName));
    const sortedOfficial = officialResults.sort((a, b) => {
      const aDomain = new URL(a.url).hostname.length;
      const bDomain = new URL(b.url).hostname.length;
      return aDomain - bDomain;
    });
    
    const decidedWebsite = sortedOfficial.length > 0 ? sortedOfficial[0].url : '';

    // 상위 1~3개 페이지 본문 추출
    const pages = [];
    const urlsToExtract = sortedOfficial.length > 0 ? sortedOfficial.slice(0, 3) : searchResults.slice(0, 3);
    
    for (const result of urlsToExtract) {
      const content = await extractPageContent(result.url);
      if (content) {
        pages.push({
          url: result.url,
          title: content.title,
          text: content.text
        });
      }
    }

    // 회사 정보 요약 생성
    const companyInfo = generateCompanyInfoSummary(companyName, searchResults);

    return {
      website: decidedWebsite,
      searchResults,
      companyInfo,
      pages
    };

  } catch (error) {
    console.error('Web search error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      website: '',
      searchResults: [],
      companyInfo: `웹 검색 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`,
      pages: []
    };
  }
}

/**
 * 회사 정보 요약 생성
 */
function generateCompanyInfoSummary(companyName: string, searchResults: WebSearchResult[]): string {
  if (searchResults.length === 0) {
    return '웹 검색 결과 없음';
  }

  // 검색 결과를 단순하게 나열
  const infoParts: string[] = [];
  
  searchResults.forEach((result, index) => {
    if (result.snippet) {
      infoParts.push(`검색결과 ${index + 1}: ${result.snippet}`);
    }
  });

  return infoParts.join('\n\n');
}

/**
 * 이메일 도메인에서 회사 웹사이트 추정 (개선된 로직)
 */
export function estimateWebsiteFromEmail(email: string): string {
  if (!email || !email.includes('@')) return '';
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return '';
  
  // 공용 도메인 제외
  if (isPublicDomain(domain)) {
    return '';
  }
  
  return `https://${domain}`;
}
