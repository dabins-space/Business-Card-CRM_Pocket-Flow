import OpenAI from 'openai';
import { searchCompanyInfo, searchCompanyNews, estimateWebsiteFromEmail } from './webSearch';

// OpenAI 클라이언트 초기화
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API 키 확인
if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key is not set in environment variables');
}

// AI 분석 요청 타입 정의
export interface ContactData {
  id: string;
  name: string;
  title?: string;
  department?: string;
  company: string;
  email?: string;
  phone?: string;
  importance: number;
  inquiry_types: string[];
  memo?: string;
  created_at: string;
}

export interface AIAnalysisRequest {
  companyName: string;
  contacts: ContactData[];
  ourCompanyInfo?: {
    companyName: string;
    productName: string;
    features: string;
    targetIndustries: string;
    proposalPoints: string;
  };
}

export interface AIAnalysisResult {
  company: string;
  overview: string;
  industry: string;
  solutions: string[];
  employees: string;
  founded: string;
  website: string;
  sources: string[];
  sourceDetails: {
    overview: string;
    industry: string;
    employees: string;
    founded: string;
  };
  recentNews: Array<{
    id: number;
    title: string;
    description: string;
    date: string;
    source: string;
    link: string;
  }>;
  proposalPoints: Array<{
    id: number;
    title: string;
    description: string;
    solution: string;
  }>;
}

// ChatGPT API 호출 함수
export async function analyzeCompanyWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
  try {
    console.log('Starting AI analysis for company:', request.companyName);
    console.log('Contacts count:', request.contacts.length);
    
    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // 웹 검색과 뉴스 검색을 병렬로 실행하여 성능 향상
    console.log('Starting parallel web and news search...');
    const [webInfo, recentNews] = await Promise.allSettled([
      searchCompanyInfo(request.companyName),
      searchCompanyNews(request.companyName)
    ]);
    
    // 웹 검색 결과 처리
    const finalWebInfo = webInfo.status === 'fulfilled' ? webInfo.value : {
      website: '',
      searchResults: []
    };
    console.log('Web search completed:', {
      website: finalWebInfo.website,
      resultsCount: finalWebInfo.searchResults.length
    });
    
    // 뉴스 검색 결과 처리
    const finalRecentNews = recentNews.status === 'fulfilled' ? recentNews.value : [];
    console.log('News search completed:', {
      newsCount: finalRecentNews.length
    });
    
    // 프롬프트 생성 (웹 정보 및 뉴스 포함)
    const prompt = generateAnalysisPrompt(request, finalWebInfo, finalRecentNews);
    
    console.log('Generated prompt length:', prompt.length);
    
    // ChatGPT API 호출 (개선된 설정)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "공식 홈페이지 정보를 최우선으로 활용, 컨텍스트(text/url)만 사용, 추측 금지, website=decidedWebsite, overview 4~5문장, industry(버티컬)/solutions 필드 필수, sources는 공식 홈페이지만."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('AI 응답이 비어있습니다');
    }

    console.log('AI response received, length:', response.length);
    
    // JSON 파싱
    let analysisResult: AIAnalysisResult;
    try {
      // JSON 코드 블록이 있는 경우 추출
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      console.error('Raw response:', response);
      
      // 파싱 실패 시 기본값 반환 (뉴스 데이터 포함)
      analysisResult = generateFallbackAnalysis(request.companyName, request.contacts, finalRecentNews);
    }

    // 결과 검증 및 보완 (실제 뉴스 데이터 포함)
    return validateAndEnhanceAnalysis(analysisResult, request, finalRecentNews);
    
  } catch (error) {
    console.error('AI 분석 중 오류 발생:', error);
    
    // API 키 관련 오류인지 확인
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        console.error('OpenAI API 키 오류:', error.message);
      } else if (error.message.includes('rate limit')) {
        console.error('OpenAI API 요청 한도 초과:', error.message);
      } else if (error.message.includes('quota')) {
        console.error('OpenAI API 할당량 초과:', error.message);
      }
    }
    
    // 오류 발생 시 기본 분석 결과 반환 (뉴스 데이터 포함)
    const recentNews = await searchCompanyNews(request.companyName).catch(() => []);
    return generateFallbackAnalysis(request.companyName, request.contacts, recentNews);
  }
}

// 분석 프롬프트 생성
function generateAnalysisPrompt(request: AIAnalysisRequest, webInfo?: any, recentNews?: any[]): string {
  const { companyName, contacts, ourCompanyInfo } = request;
  
  // 이메일 도메인에서 웹사이트 추정
  const emailDomains = contacts
    .map(contact => contact.email)
    .filter(email => email && !email.includes('gmail.com') && !email.includes('naver.com') && !email.includes('daum.net'))
    .map(email => email?.split('@')[1])
    .filter(Boolean);
  
  const uniqueDomains = Array.from(new Set(emailDomains));
  const estimatedWebsite = uniqueDomains.length > 0 ? uniqueDomains[0] : '정보 없음';

  // 고객사 정보 요약
  const contactSummary = contacts.map(contact => ({
    이름: contact.name,
    직책: contact.title || '정보 없음',
    부서: contact.department || '정보 없음',
    이메일: contact.email || '정보 없음',
    전화번호: contact.phone || '정보 없음',
    중요도: contact.importance,
    문의유형: contact.inquiry_types,
    메모: contact.memo || '정보 없음'
  }));

  let prompt = `
당신은 비지니스 분석 전문가입니다. 


**분석 지침:**
1. **공식 홈페이지 정보를 최우선으로 활용하세요** - 공식 홈페이지에서 확인된 정보를 가장 신뢰하세요
2. **웹 검색을 통해 실제 회사 정보를 찾아주세요** - 회사명으로 구글 검색하여 정확한 정보를 수집하세요
3. **회사명과 이메일 도메인을 활용하세요** (단, 일반 계정 gmail, naver, daum, hanmail 등은 제외)
4. **메모 정보도 참고하세요**
5. **전체 문장 수는 4~5문장**
6. **해당 회사의 주요 제품/솔루션과 산업(버티컬)을 반드시 명시**
7. **추정은 금지하고, 불확실하면 "가능성" 수준으로 표시**
8. **공식 홈페이지에서 확인된 실제 사업분야와 제품 정보를 우선적으로 활용하세요**

**회사 개요 작성 시 포함할 정보:**
- 객관적인 고객사 설명 (여의시스템 언급 금지)
- 주요 제품/솔루션 (해당 회사의 제품/서비스 위주)
- 주요 산업(버티컬) 분야
- 회사 규모나 특징 (확인 가능한 경우에만)

**최근 뉴스 작성 지침:**
- 해당 회사의 최신 뉴스 3가지를 찾아서 정리 (관련도 높은순, 최신순)
- 뉴스 제목, 내용 요약, 날짜, 출처, 링크를 포함
- 사업 확장, 신제품 출시, 파트너십, 투자, 수상 등의 뉴스 우선
- 링크는 실제 뉴스 기사 URL을 제공하되, 없으면 "정보 없음"으로 표시
- 날짜는 실제 뉴스 날짜를 정확히 표시 (2025년 현재 기준)

**제안 포인트:**
- 제안 포인트는 별도의 API를 통해 생성되므로 여기서는 빈 배열로 설정하세요.
- "proposalPoints": []

## 고객사 명함 정보:
${JSON.stringify(contactSummary, null, 2)}

## 웹 검색 결과:
${webInfo ? `
**공식 홈페이지**: ${webInfo.website || '정보 없음'}

**공식 홈페이지 본문** (최우선 참고):
${webInfo.pages.filter((page: any) => page.url === webInfo.website).map((page: any, index: number) => 
  `제목: ${page.title}\n내용: ${page.text}`
).join('\n\n')}

**기타 웹페이지 본문** (참고용):
${webInfo.pages.filter((page: any) => page.url !== webInfo.website).map((page: any, index: number) => 
  `페이지 ${index + 1} (${page.url}):\n제목: ${page.title}\n내용: ${page.text}`
).join('\n\n')}

**검색 결과 요약**:
${webInfo.companyInfo}
` : '웹 검색 정보 없음'}

## 최근 뉴스:
${recentNews && recentNews.length > 0 ? `
**실제 뉴스 검색 결과**:
${recentNews.map((news: any) => 
  `제목: ${news.title}\n내용: ${news.description}\n날짜: ${news.date}\n출처: ${news.source}\n링크: ${news.link}`
).join('\n\n')}
` : '뉴스 검색 결과 없음'}

`;

  // 우리 회사 정보가 있는 경우 추가
  if (ourCompanyInfo) {
    prompt += `
## 우리 회사 정보:
- 회사명: ${ourCompanyInfo.companyName}
- 제품명: ${ourCompanyInfo.productName}
- 핵심 기능: ${ourCompanyInfo.features}
- 타겟 산업: ${ourCompanyInfo.targetIndustries}
- 제안 포인트: ${ourCompanyInfo.proposalPoints}

위 정보를 바탕으로 더 구체적이고 맞춤화된 비즈니스 기회와 제안 포인트를 제시해주세요.
`;
  }

  prompt += `
## 응답 형식:
다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "company": "${companyName}",
  "overview": "객관적인 고객사 정보 (여의시스템 언급 금지, 반드시 4~5문장으로 제한, 주요 제품/솔루션과 산업(버티컬) 반드시 명시)",
  "industry": "주요 산업(버티컬) 분야",
  "solutions": ["주요 솔루션 1", "주요 솔루션 2", "주요 솔루션 3"],
  "employees": "직원 수 (확인 불가 시 '정보가 제한적')",
  "founded": "설립년도 (확인 불가 시 '정보가 제한적')",
  "website": "${webInfo?.website || estimatedWebsite}",
  "sources": [${webInfo?.website ? `"${webInfo.website}"` : '["정보가 제한적"]'}],
  "sourceDetails": {
    "overview": "${webInfo?.website ? '공식 홈페이지' : '정보가 제한적'}",
    "industry": "${webInfo?.website ? '공식 홈페이지' : '정보가 제한적'}",
    "employees": "${webInfo?.website ? '공식 홈페이지' : '정보가 제한적'}",
    "founded": "${webInfo?.website ? '공식 홈페이지' : '정보가 제한적'}"
  },
  "recentNews": [
    {
      "id": 1,
      "title": "뉴스 제목 1",
      "description": "뉴스 내용 요약 1",
      "date": "2025년 월",
      "source": "뉴스 출처 1",
      "link": "뉴스 링크 URL 1"
    },
    {
      "id": 2,
      "title": "뉴스 제목 2",
      "description": "뉴스 내용 요약 2",
      "date": "2025년 월",
      "source": "뉴스 출처 2",
      "link": "뉴스 링크 URL 2"
    },
    {
      "id": 3,
      "title": "뉴스 제목 3",
      "description": "뉴스 내용 요약 3",
      "date": "2025년 월",
      "source": "뉴스 출처 3",
      "link": "뉴스 링크 URL 3"
    }
  ],
  "proposalPoints": []
}
\`\`\`

**응답 시 주의사항:**
- **공식 홈페이지 정보를 최우선으로 활용하세요** - 공식 홈페이지에서 확인된 정보를 가장 신뢰
- **뉴스가 없으면 "뉴스 없음"으로 표시** - 관련 없는 뉴스는 포함하지 마세요
- 불확실한 정보는 "가능성" 수준으로 표시하거나 "정보가 제한적"으로 명시
- 추정은 절대 금지
- 주요 제품/솔루션과 산업(버티컬)은 반드시 포함
- **개요(overview)는 반드시 4~5문장으로 제한** (6문장 이상 절대 금지)
- 공식 홈페이지에서 확인된 실제 사업분야와 제품 정보를 우선적으로 활용
- **제안 포인트는 항상 빈 배열로 설정** - 별도 API에서 생성됩니다

한국어로 응답해주세요.
`;

  return prompt;
}

// 분석 결과 검증 및 보완
function validateAndEnhanceAnalysis(result: any, request: AIAnalysisRequest, recentNews?: any[]): AIAnalysisResult {
  const { companyName, contacts } = request;
  
  return {
    company: result.company || companyName,
    overview: result.overview || `${companyName}에 대한 기본 정보가 부족하여 정확한 분석이 어렵습니다.`,
    industry: result.industry || "정보 없음",
    solutions: result.solutions || ["정보가 제한적"],
    employees: result.employees || "정보 없음",
    founded: result.founded || "정보 없음",
    website: result.website || "정보 없음",
    sources: Array.isArray(result.sources) ? result.sources.filter((s: any) => typeof s === 'string') : [],
    sourceDetails: result.sourceDetails || {
      overview: "정보가 제한적",
      industry: "정보가 제한적",
      employees: "정보가 제한적",
      founded: "정보가 제한적"
    },
    recentNews: result.recentNews || recentNews || [
      {
        id: 1,
        title: "최근 뉴스 정보 없음",
        description: "웹 검색을 통해 최근 뉴스를 찾을 수 없습니다.",
        date: "정보 없음",
        source: "정보 없음",
        link: "정보 없음"
      },
      {
        id: 2,
        title: "최근 뉴스 정보 없음",
        description: "웹 검색을 통해 최근 뉴스를 찾을 수 없습니다.",
        date: "정보 없음",
        source: "정보 없음",
        link: "정보 없음"
      },
      {
        id: 3,
        title: "최근 뉴스 정보 없음",
        description: "웹 검색을 통해 최근 뉴스를 찾을 수 없습니다.",
        date: "정보 없음",
        source: "정보 없음",
        link: "정보 없음"
      }
    ],
    proposalPoints: result.proposalPoints || []
  };
}

// 오류 발생 시 기본 분석 결과 생성
function generateFallbackAnalysis(companyName: string, contacts: ContactData[], recentNews?: any[]): AIAnalysisResult {
  const contactCount = contacts.length;
  const positions = contacts.map(c => c.title).filter(Boolean);
  const departments = contacts.map(c => c.department).filter(Boolean);
  
  return {
    company: companyName,
    overview: `${companyName}은(는) 현재 ${contactCount}명의 연락처가 등록되어 있습니다. 주요 직책으로는 ${positions.slice(0, 3).join(', ')} 등이 있으며, 다양한 부서에서 활동하고 있습니다.`,
    industry: "정보 분석 중",
    solutions: ["정보가 제한적"],
    employees: contactCount > 5 ? "50-100명" : "10-50명",
    founded: "정보 없음",
    website: "정보 없음",
    sources: [],
    sourceDetails: {
      overview: "정보가 제한적",
      industry: "정보가 제한적",
      employees: "정보가 제한적",
      founded: "정보가 제한적"
    },
    recentNews: recentNews || [
      {
        id: 1,
        title: "최근 뉴스 정보 없음",
        description: "웹 검색을 통해 최근 뉴스를 찾을 수 없습니다.",
        date: "정보 없음",
        source: "정보 없음",
        link: "정보 없음"
      },
      {
        id: 2,
        title: "최근 뉴스 정보 없음",
        description: "웹 검색을 통해 최근 뉴스를 찾을 수 없습니다.",
        date: "정보 없음",
        source: "정보 없음",
        link: "정보 없음"
      },
      {
        id: 3,
        title: "최근 뉴스 정보 없음",
        description: "웹 검색을 통해 최근 뉴스를 찾을 수 없습니다.",
        date: "정보 없음",
        source: "정보 없음",
        link: "정보 없음"
      }
    ],
    proposalPoints: []
  };
}
