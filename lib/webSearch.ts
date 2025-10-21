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
 * SERP API를 사용한 뉴스 검색 (최신 뉴스 우선)
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
  
  console.log('=== News Search Debug ===');
  console.log('Company name:', companyName);
  console.log('SERP_API_KEY available:', !!apiKey);
  
  if (!apiKey) {
    console.log('SERP_API_KEY not found, trying alternative news search');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('SERP') || key.includes('API')));
    
    // SERP API가 없는 경우 대안적인 뉴스 검색 시도
    return await searchNewsAlternative(companyName);
  }

  try {
    // Google 뉴스 탭에서 최신 뉴스 검색을 위한 쿼리 개선 (비용 절약을 위해 10개로 제한)
    const newsQuery = `"${companyName}" 뉴스`;
    const newsUrl = `https://serpapi.com/search?api_key=${apiKey}&q=${encodeURIComponent(newsQuery)}&tbm=nws&num=10&gl=kr&hl=ko&sort=date&tbs=qdr:d`;
    
    console.log('Searching for company news:', companyName);
    console.log('News query:', newsQuery);
    console.log('News URL:', newsUrl);
    
    const response = await fetch(newsUrl);
    console.log('News response status:', response.status);
    console.log('News response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('News API response not ok:', response.status, response.statusText);
      console.error('Error response body:', errorText);
      console.log('Falling back to alternative news search...');
      return await searchNewsAlternative(companyName);
    }
    
    const data = await response.json();
    console.log('Raw news data:', JSON.stringify(data, null, 2));
    console.log('News results count:', data.news_results?.length || 0);
    
    if (!data.news_results || data.news_results.length === 0) {
      console.log('No news results found, trying alternative search...');
      return await searchNewsAlternative(companyName);
    }

    // 뉴스 관련도 점수 계산 및 필터링
    const scoredNews = data.news_results.map((news: any) => {
      const title = (news.title || '').toLowerCase();
      const description = (news.snippet || '').toLowerCase();
      const companyNameLower = companyName.toLowerCase();
      
      // 관련도 점수 계산 (0-100)
      let relevanceScore = 0;
      
      // 제목에 회사명이 포함된 경우 높은 점수
      if (title.includes(companyNameLower)) {
        relevanceScore += 50;
        
        // 제목의 시작 부분에 회사명이 있으면 추가 점수
        if (title.startsWith(companyNameLower)) {
          relevanceScore += 20;
        }
      }
      
      // 내용에 회사명이 포함된 경우 점수
      if (description.includes(companyNameLower)) {
        relevanceScore += 30;
      }
      
      // 고품질 콘텐츠 키워드 (인터뷰, 인사이트 등) - 높은 점수
      const highQualityKeywords = [
        '인터뷰', '인사이트', '대표', 'CEO', 'CTO', 'CFO', '창업자', '설립자', 
        '시장', '전망', '분석', '전문가', '의견', '견해', '진실', '비밀', 
        '스토리', '이야기', '경험', '조언', '팁', '노하우', '독점', '특종',
        'Y인사이트', 'Y인터뷰', 'CEO인터뷰', '창업자이야기', '성공스토리',
        '시장분석', '업계전망', '전문가의견', '리더십', '경영철학'
      ];
      const titleHighQuality = highQualityKeywords.filter(keyword => title.includes(keyword));
      const descHighQuality = highQualityKeywords.filter(keyword => description.includes(keyword));
      
      // 고품질 콘텐츠는 높은 점수 부여
      relevanceScore += titleHighQuality.length * 15;  // 제목에 있으면 높은 점수
      relevanceScore += descHighQuality.length * 12;   // 내용에 있으면 높은 점수
      
      // 최근 소식 키워드 (적당한 점수)
      const recentNewsKeywords = [
        '출시', '발표', '투자', '계약', '파트너십', '성장', '매출', '실적', 
        '신제품', '기술', '혁신', '확장', '인수', '합병', '공개', '오픈',
        '시작', '준비', '계획', '예정', '예고', '소식', '뉴스', '보도',
        '업데이트', '업그레이드', '개선', '강화', '확대', '증가'
      ];
      const titleRecent = recentNewsKeywords.filter(keyword => title.includes(keyword));
      const descRecent = recentNewsKeywords.filter(keyword => description.includes(keyword));
      
      // 최근 소식은 적당한 점수 부여
      relevanceScore += titleRecent.length * 8;   // 제목에 있으면 적당한 점수
      relevanceScore += descRecent.length * 6;    // 내용에 있으면 적당한 점수
      
      // 콘텐츠 길이 점수 (긴 기사일수록 더 자세한 내용)
      const contentLength = (title + description).length;
      if (contentLength > 200) relevanceScore += 5;      // 200자 이상
      if (contentLength > 500) relevanceScore += 10;     // 500자 이상
      if (contentLength > 1000) relevanceScore += 15;    // 1000자 이상
      
      
      // 출처 신뢰도 점수
      const source = (news.source || '').toLowerCase();
      if (source.includes('조선') || source.includes('중앙') || source.includes('동아') || 
          source.includes('한국경제') || source.includes('매일경제') || source.includes('서울경제')) {
        relevanceScore += 10;
      }
      
      console.log(`News relevance score: "${news.title}" - Score: ${relevanceScore}`);
      
      return {
        ...news,
        relevanceScore
      };
    }).filter((news: any) => news.relevanceScore > 0); // 관련도가 있는 뉴스만 필터링
    
    // 관련도 + 최신순 정렬
    const sortedNews = scoredNews.sort((a: any, b: any) => {
      // 1순위: 관련도 점수 (높은 순)
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // 2순위: 날짜 (최신순)
      const dateA = parseNewsDate(a.date);
      const dateB = parseNewsDate(b.date);
      
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // 3순위: 위치 (앞에 나온 것이 더 최신)
      return 0;
    });
    
    console.log(`Total relevant news found: ${sortedNews.length}`);
    
    // 중복 제거 - 관련도가 높고 최신순인 뉴스를 우선으로 선택
    const uniqueNews: any[] = [];
    
    for (const news of sortedNews) {
      const currentTitle = (news.title || '').toLowerCase();
      const isDuplicate = uniqueNews.some((existingNews: any) => {
        const existingTitle = (existingNews.title || '').toLowerCase();
        const similarity = calculateSimilarity(currentTitle, existingTitle);
        return similarity > 0.8;
      });
      
      if (!isDuplicate) {
        uniqueNews.push(news);
        console.log(`Added unique news: "${news.title}" (Score: ${news.relevanceScore})`);
        
        // 3개까지만 수집
        if (uniqueNews.length >= 3) break;
      } else {
        console.log(`Skipping duplicate news: "${news.title}" (Score: ${news.relevanceScore})`);
      }
    }
    
    console.log('Unique news count:', uniqueNews.length);
    
    if (uniqueNews.length === 0) {
      console.log('No unique news found, trying alternative search...');
      return await searchNewsAlternative(companyName);
    }
    
    // 최신 3개 뉴스 선택 (고유한 뉴스만)
    const newsResults = uniqueNews.map((news: any, index: number) => {
      // 링크 정리 및 검증
      let cleanLink = news.link || '';
      
      console.log(`Processing link for news: "${news.title}"`);
      console.log(`Original link: ${cleanLink}`);
      
      // Google News 링크인 경우 실제 뉴스 링크로 변환 시도
      if (cleanLink.includes('news.google.com')) {
        console.log('Google News link detected, extracting real URL...');
        
        // 여러 패턴으로 실제 URL 추출 시도
        const patterns = [
          /url=([^&]+)/,           // url=패턴
          /&url=([^&]+)/,          // &url=패턴
          /article_url=([^&]+)/,   // article_url=패턴
          /&article_url=([^&]+)/,  // &article_url=패턴
          /q=([^&]+)/,             // q=패턴 (검색 쿼리)
          /&q=([^&]+)/             // &q=패턴
        ];
        
        let extractedUrl = null;
        for (const pattern of patterns) {
          const match = cleanLink.match(pattern);
          if (match) {
            extractedUrl = decodeURIComponent(match[1]);
            console.log(`Extracted URL using pattern ${pattern}: ${extractedUrl}`);
            break;
          }
        }
        
        if (extractedUrl) {
          cleanLink = extractedUrl;
        } else {
          console.log('Could not extract real URL from Google News link');
        }
      }
      
      // 링크 정리 및 검증
      cleanLink = cleanAndValidateLink(cleanLink);
      
      // 링크가 유효하지 않은 경우 대안 제공
      if (cleanLink === '정보 없음') {
        // Google 검색 링크 생성 (회사명 + 뉴스 제목)
        const searchQuery = encodeURIComponent(`${companyName} ${news.title}`);
        cleanLink = `https://www.google.com/search?q=${searchQuery}&tbm=nws`;
        console.log(`Generated Google search fallback link: ${cleanLink}`);
      }
      
      console.log(`Final processed link: ${cleanLink}`);
      
      return {
        id: index + 1,
        title: news.title || '제목 없음',
        description: news.snippet || '내용 없음',
        date: formatNewsDate(news.date) || '날짜 정보 없음',
        source: news.source || '출처 없음',
        link: cleanLink
      };
    });

    console.log('Final processed news results:', newsResults);
    console.log('=== End News Search Debug ===');

    return newsResults;

  } catch (error) {
    console.error('News search error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('Falling back to alternative news search due to error...');
    console.log('=== End News Search Debug (Error) ===');
    return await searchNewsAlternative(companyName);
  }
}

/**
 * 뉴스 날짜 파싱 함수
 */
function parseNewsDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // 다양한 날짜 형식 처리
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // 상대적 날짜 처리 (예: "2시간 전", "1일 전")
      if (dateStr.includes('시간 전')) {
        const hours = parseInt(dateStr.match(/(\d+)시간 전/)?.[1] || '0');
        return new Date(Date.now() - hours * 60 * 60 * 1000);
      } else if (dateStr.includes('일 전')) {
        const days = parseInt(dateStr.match(/(\d+)일 전/)?.[1] || '0');
        return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      } else if (dateStr.includes('분 전')) {
        const minutes = parseInt(dateStr.match(/(\d+)분 전/)?.[1] || '0');
        return new Date(Date.now() - minutes * 60 * 1000);
      }
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * 뉴스 날짜 포맷팅 함수
 */
function formatNewsDate(dateStr: string): string {
  const date = parseNewsDate(dateStr);
  if (!date) return dateStr;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) {
    return '방금 전';
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR');
  }
}

/**
 * 대안적인 뉴스 검색 (SERP API 없이)
 */
async function searchNewsAlternative(companyName: string): Promise<Array<{
  id: number;
  title: string;
  description: string;
  date: string;
  source: string;
  link: string;
}>> {
  console.log('Trying alternative news search for:', companyName);
  
  try {
    // Google News RSS 피드 사용 (무료)
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${companyName}"`)}&hl=ko&gl=KR&ceid=KR:ko`;
    
    console.log('RSS URL:', rssUrl);
    
    const response = await fetch(rssUrl);
    
    if (!response.ok) {
      console.error('RSS fetch failed:', response.status);
      return generateMockNews(companyName);
    }
    
    const xmlText = await response.text();
    console.log('RSS response length:', xmlText.length);
    
    // 간단한 XML 파싱 (RSS 아이템 추출)
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log('Found RSS items:', items.length);
    
    // RSS 뉴스 관련도 점수 계산 및 필터링
    const scoredRssNews = items.map((item, index) => {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      const descriptionMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
      
      const title = titleMatch ? titleMatch[1].trim() : '제목 없음';
      let link = linkMatch ? linkMatch[1].trim() : '정보 없음';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '날짜 정보 없음';
      const description = descriptionMatch ? descriptionMatch[1].trim().replace(/<[^>]*>/g, '') : '내용 없음';
      
      console.log(`Processing RSS link for news: "${title}"`);
      console.log(`Original RSS link: ${link}`);
      
      // Google News 링크인 경우 실제 뉴스 링크로 변환 시도
      if (link.includes('news.google.com')) {
        console.log('Google News RSS link detected, extracting real URL...');
        
        // 여러 패턴으로 실제 URL 추출 시도
        const patterns = [
          /url=([^&]+)/,           // url=패턴
          /&url=([^&]+)/,          // &url=패턴
          /article_url=([^&]+)/,   // article_url=패턴
          /&article_url=([^&]+)/,  // &article_url=패턴
          /q=([^&]+)/,             // q=패턴 (검색 쿼리)
          /&q=([^&]+)/             // &q=패턴
        ];
        
        let extractedUrl = null;
        for (const pattern of patterns) {
          const match = link.match(pattern);
          if (match) {
            extractedUrl = decodeURIComponent(match[1]);
            console.log(`Extracted RSS URL using pattern ${pattern}: ${extractedUrl}`);
            break;
          }
        }
        
        if (extractedUrl) {
          link = extractedUrl;
        } else {
          console.log('Could not extract real URL from Google News RSS link');
        }
      }
      
      // 링크 정리 및 검증
      link = cleanAndValidateLink(link);
      
      // 링크가 유효하지 않은 경우 대안 제공
      if (link === '정보 없음') {
        // Google 검색 링크 생성 (회사명 + 뉴스 제목)
        const searchQuery = encodeURIComponent(`${companyName} ${title}`);
        link = `https://www.google.com/search?q=${searchQuery}&tbm=nws`;
        console.log(`Generated Google search fallback link for RSS: ${link}`);
      }
      
      console.log(`Final processed RSS link: ${link}`);
      
      // 출처 추출 (링크에서 도메인 추출)
      let source = '정보 없음';
      try {
        const url = new URL(link);
        source = url.hostname.replace('www.', '');
      } catch (e) {
        // URL 파싱 실패 시 기본값 유지
      }
      
      // 관련도 점수 계산
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();
      const companyNameLower = companyName.toLowerCase();
      
      let relevanceScore = 0;
      
      // 제목에 회사명이 포함된 경우 높은 점수
      if (titleLower.includes(companyNameLower)) {
        relevanceScore += 50;
        if (titleLower.startsWith(companyNameLower)) {
          relevanceScore += 20;
        }
      }
      
      // 내용에 회사명이 포함된 경우 점수
      if (descLower.includes(companyNameLower)) {
        relevanceScore += 30;
      }
      
      // 고품질 콘텐츠 키워드 (인터뷰, 인사이트 등) - 높은 점수
      const highQualityKeywords = [
        '인터뷰', '인사이트', '대표', 'CEO', 'CTO', 'CFO', '창업자', '설립자', 
        '시장', '전망', '분석', '전문가', '의견', '견해', '진실', '비밀', 
        '스토리', '이야기', '경험', '조언', '팁', '노하우', '독점', '특종',
        'Y인사이트', 'Y인터뷰', 'CEO인터뷰', '창업자이야기', '성공스토리',
        '시장분석', '업계전망', '전문가의견', '리더십', '경영철학'
      ];
      const titleHighQuality = highQualityKeywords.filter(keyword => titleLower.includes(keyword));
      const descHighQuality = highQualityKeywords.filter(keyword => descLower.includes(keyword));
      
      // 고품질 콘텐츠는 높은 점수 부여
      relevanceScore += titleHighQuality.length * 15;  // 제목에 있으면 높은 점수
      relevanceScore += descHighQuality.length * 12;   // 내용에 있으면 높은 점수
      
      // 최근 소식 키워드 (적당한 점수)
      const recentNewsKeywords = [
        '출시', '발표', '투자', '계약', '파트너십', '성장', '매출', '실적', 
        '신제품', '기술', '혁신', '확장', '인수', '합병', '공개', '오픈',
        '시작', '준비', '계획', '예정', '예고', '소식', '뉴스', '보도',
        '업데이트', '업그레이드', '개선', '강화', '확대', '증가'
      ];
      const titleRecent = recentNewsKeywords.filter(keyword => titleLower.includes(keyword));
      const descRecent = recentNewsKeywords.filter(keyword => descLower.includes(keyword));
      
      // 최근 소식은 적당한 점수 부여
      relevanceScore += titleRecent.length * 8;   // 제목에 있으면 적당한 점수
      relevanceScore += descRecent.length * 6;    // 내용에 있으면 적당한 점수
      
      // 콘텐츠 길이 점수 (긴 기사일수록 더 자세한 내용)
      const contentLength = (title + description).length;
      if (contentLength > 200) relevanceScore += 5;      // 200자 이상
      if (contentLength > 500) relevanceScore += 10;     // 500자 이상
      if (contentLength > 1000) relevanceScore += 15;    // 1000자 이상
      
      // 출처 신뢰도 점수
      if (source.includes('조선') || source.includes('중앙') || source.includes('동아') || 
          source.includes('한국경제') || source.includes('매일경제') || source.includes('서울경제')) {
        relevanceScore += 10;
      }
      
      // RSS 순서 점수 (앞에 나온 것이 더 높은 점수)
      relevanceScore += Math.max(0, 20 - index);
      
      console.log(`RSS News relevance score: "${title}" - Score: ${relevanceScore}`);
      
      return {
        title,
        description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
        date: formatNewsDate(pubDate),
        source,
        link,
        relevanceScore
      };
    }).filter(news => news.relevanceScore > 0);
    
    // 관련도 + 최신순 정렬
    const sortedRssNews = scoredRssNews.sort((a, b) => {
      // 1순위: 관련도 점수 (높은 순)
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // 2순위: 날짜 (최신순)
      const dateA = parseNewsDate(a.date);
      const dateB = parseNewsDate(b.date);
      
      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      
      return 0;
    });
    
    // 중복 제거 - 관련도가 높고 최신순인 뉴스를 우선으로 선택
    const uniqueNews: any[] = [];
    
    for (const news of sortedRssNews) {
      const currentTitle = news.title.toLowerCase();
      const isDuplicate = uniqueNews.some((existingNews: any) => {
        const existingTitle = existingNews.title.toLowerCase();
        const similarity = calculateSimilarity(currentTitle, existingTitle);
        return similarity > 0.8;
      });
      
      if (!isDuplicate) {
        uniqueNews.push(news);
        console.log(`Added unique RSS news: "${news.title}" (Score: ${news.relevanceScore})`);
        
        // 3개까지만 수집
        if (uniqueNews.length >= 3) break;
      } else {
        console.log(`Skipping duplicate RSS news: "${news.title}" (Score: ${news.relevanceScore})`);
      }
    }
    
    const newsResults = uniqueNews.map((news, index) => ({
      id: index + 1,
      ...news
    }));
    
    console.log('Alternative news results:', newsResults);
    return newsResults;
    
  } catch (error) {
    console.error('Alternative news search error:', error);
    return generateMockNews(companyName);
  }
}

/**
 * 문자열 유사도 계산 (0-1 사이의 값)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  // 간단한 Jaccard 유사도 계산
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * URL 유효성 검사
 */
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * 링크 정리 및 검증
 */
function cleanAndValidateLink(link: string): string {
  if (!link || link === '정보 없음' || link.trim() === '') {
    return '정보 없음';
  }
  
  let cleanLink = link.trim();
  
  // URL 인코딩 문제 해결
  try {
    // 이미 인코딩된 경우 디코딩 후 다시 인코딩
    if (cleanLink.includes('%')) {
      cleanLink = decodeURIComponent(cleanLink);
    }
  } catch (e) {
    console.log('URL decoding failed, using original:', cleanLink);
  }
  
  // 프로토콜이 없는 경우 https 추가
  if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
    cleanLink = 'https://' + cleanLink;
  }
  
  // URL 유효성 검사
  if (!isValidUrl(cleanLink)) {
    console.log('Invalid URL after cleaning:', cleanLink);
    return '정보 없음';
  }
  
  // 특수 문자 정리
  cleanLink = cleanLink
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  return cleanLink;
}

/**
 * 모의 뉴스 데이터 생성 (모든 방법이 실패했을 때)
 */
function generateMockNews(companyName: string): Array<{
  id: number;
  title: string;
  description: string;
  date: string;
  source: string;
  link: string;
}> {
  console.log('Generating mock news for:', companyName);
  
  return [
    {
      id: 1,
      title: `${companyName} 관련 최신 뉴스`,
      description: `${companyName}에 대한 최신 뉴스를 찾을 수 없습니다. 뉴스 검색 API 설정을 확인해주세요.`,
      date: '정보 없음',
      source: '시스템',
      link: '정보 없음'
    },
    {
      id: 2,
      title: `${companyName} 업계 동향`,
      description: `${companyName}의 업계 동향과 최신 소식을 확인하려면 뉴스 검색 서비스를 설정해주세요.`,
      date: '정보 없음',
      source: '시스템',
      link: '정보 없음'
    },
    {
      id: 3,
      title: `${companyName} 비즈니스 뉴스`,
      description: `${companyName}의 비즈니스 뉴스와 업데이트를 받으려면 SERP API 키를 설정해주세요.`,
      date: '정보 없음',
      source: '시스템',
      link: '정보 없음'
    }
  ];
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
