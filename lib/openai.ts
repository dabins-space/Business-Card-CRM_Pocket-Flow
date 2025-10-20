import OpenAI from 'openai';

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
  employees: string;
  founded: string;
  website: string;
  opportunities: Array<{
    id: number;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    timeline: string;
  }>;
  proposalPoints: string[];
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
    
    // 프롬프트 생성
    const prompt = generateAnalysisPrompt(request);
    
    console.log('Generated prompt length:', prompt.length);
    
    // ChatGPT API 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 비용 효율적인 모델 사용
      messages: [
        {
          role: "system",
          content: "당신은 비즈니스 분석 전문가입니다. 고객사의 명함 정보를 바탕으로 회사 개요, 산업 분석, 비즈니스 기회를 도출하고 JSON 형태로 응답해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
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
      
      // 파싱 실패 시 기본값 반환
      analysisResult = generateFallbackAnalysis(request.companyName, request.contacts);
    }

    // 결과 검증 및 보완
    return validateAndEnhanceAnalysis(analysisResult, request);
    
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
    
    // 오류 발생 시 기본 분석 결과 반환
    return generateFallbackAnalysis(request.companyName, request.contacts);
  }
}

// 분석 프롬프트 생성
function generateAnalysisPrompt(request: AIAnalysisRequest): string {
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
당신은 여의시스템(YOISYS)의 영업 사원입니다.  
여의시스템은 산업용 컴퓨터, AI 컨트롤러, 네트워크 장비를 공급하며  
Moxa와 같은 산업 네트워크 장비 브랜드와 협력하고 있습니다.

아래 명함 정보를 참고하여, **회사 개요는 객관적인 고객사 정보 중심으로**,  
**비즈니스 기회와 제안 포인트는 여의시스템 영업 담당자의 시각에서** 작성하세요.  
분석은 회사명과 이메일 도메인만을 기반으로 하며, 전체는 3~4문장 이내로 요약하세요.  
결과는 JSON 형식으로 반환하세요.  
특히 회사 개요 부분에서 담았으면 하는 정보는 아래와 같습니다
-객관적인 고객사 설명, 여의시스템 언급 금지
- 주요 판매 제품 및 솔루션 (그 회사의 제품/서비스 위주)
- 주요 산업(버티컬) 분야

## 고객사 명함 정보:
${JSON.stringify(contactSummary, null, 2)}

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
  "overview": "객관적인 고객사 정보 (여의시스템 언급 금지, 3~4문장 요약)",
  "industry": "주요 산업(버티컬) 분야",
  "employees": "직원 수 추정",
  "founded": "정보 없음",
  "website": "${estimatedWebsite}",
  "opportunities": [
    {
      "id": 1,
      "title": "기회 제목",
      "description": "구체적인 설명",
      "priority": "high|medium|low",
      "impact": "높음|중간|낮음",
      "timeline": "예상 기간"
    }
  ],
  "proposalPoints": [
    "제안 포인트 1",
    "제안 포인트 2", 
    "제안 포인트 3"
  ]
}
\`\`\`

한국어로 응답해주세요.
`;

  return prompt;
}

// 분석 결과 검증 및 보완
function validateAndEnhanceAnalysis(result: any, request: AIAnalysisRequest): AIAnalysisResult {
  const { companyName, contacts } = request;
  
  return {
    company: result.company || companyName,
    overview: result.overview || `${companyName}에 대한 기본 정보가 부족하여 정확한 분석이 어렵습니다.`,
    industry: result.industry || "정보 없음",
    employees: result.employees || "정보 없음",
    founded: result.founded || "정보 없음",
    website: result.website || "정보 없음",
    opportunities: result.opportunities || [
      {
        id: 1,
        title: "기본 협업 기회",
        description: "더 많은 정보가 필요합니다.",
        priority: "medium" as const,
        impact: "중간",
        timeline: "정보 필요"
      }
    ],
    proposalPoints: result.proposalPoints || [
      "고객사와의 관계 구축",
      "추가 정보 수집 필요",
      "맞춤형 제안 준비"
    ]
  };
}

// 오류 발생 시 기본 분석 결과 생성
function generateFallbackAnalysis(companyName: string, contacts: ContactData[]): AIAnalysisResult {
  const contactCount = contacts.length;
  const positions = contacts.map(c => c.title).filter(Boolean);
  const departments = contacts.map(c => c.department).filter(Boolean);
  
  return {
    company: companyName,
    overview: `${companyName}은(는) 현재 ${contactCount}명의 연락처가 등록되어 있습니다. 주요 직책으로는 ${positions.slice(0, 3).join(', ')} 등이 있으며, 다양한 부서에서 활동하고 있습니다.`,
    industry: "정보 분석 중",
    employees: contactCount > 5 ? "50-100명" : "10-50명",
    founded: "정보 없음",
    website: "정보 없음",
    opportunities: [
      {
        id: 1,
        title: "기본 협업 기회",
        description: "등록된 연락처 정보를 바탕으로 협업 가능성을 모색할 수 있습니다.",
        priority: "medium",
        impact: "중간",
        timeline: "1-2개월"
      }
    ],
    proposalPoints: [
      `${contactCount}명의 연락처 네트워크 활용`,
      "다양한 부서와의 협업 기회",
      "장기적 비즈니스 관계 구축"
    ]
  };
}
