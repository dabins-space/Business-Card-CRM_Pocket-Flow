import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateProposalsRequest {
  companyName: string;
  selectedProducts: string[];
  companyInfo: any;
  recentNews: any[];
}

interface ProposalPoint {
  id: number;
  title: string;
  description: string;
  solution: string;
}

interface GenerateProposalsResponse {
  ok: boolean;
  proposals?: ProposalPoint[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateProposalsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { companyName, selectedProducts, companyInfo, recentNews }: GenerateProposalsRequest = req.body;

    if (!companyName || !selectedProducts || selectedProducts.length === 0) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // 제안 포인트 생성 프롬프트
    const prompt = `
당신은 영업팀장입니다. 영업사원들에게 해당 고객사를 어떻게 공략할지 전략적으로 안내하세요.

## 고객사 정보:
- 회사명: ${companyName}
- 개요: ${companyInfo.overview || '정보 없음'}
- 산업: ${companyInfo.industry || '정보 없음'}
- 솔루션: ${companyInfo.solutions || '정보 없음'}
- 직원 수: ${companyInfo.employees || '정보 없음'}
- 설립년도: ${companyInfo.founded || '정보 없음'}
- 웹사이트: ${companyInfo.website || '정보 없음'}

## 최근 뉴스:
${recentNews && recentNews.length > 0 ? 
  recentNews.map(news => `- ${news.title}: ${news.description} (${news.date})`).join('\n') :
  '최근 뉴스 정보 없음'
}

## 선택된 제안 제품:
${selectedProducts.map(product => `- ${product}`).join('\n')}

## 지침:
1. 위의 고객사 정보와 최근 뉴스를 바탕으로 선택된 제품들에 대한 제안 포인트를 생성하세요.
2. 각 제안 포인트는 서로 다른 제품을 대상으로 하세요.
3. 제목은 ChatGPT가 분석해서 내용을 담아야 합니다 (단순한 제품 소개가 아님).
4. 내용은 영업팀장이 영업사원에게 말하듯이 전략적이고 구체적으로 작성하세요.
5. 고객사의 실제 상황과 니즈를 고려한 맞춤형 제안이어야 합니다.
6. 여의시스템 언급은 금지합니다.

## 응답 형식 (JSON):
{
  "proposals": [
    {
      "id": 1,
      "title": "분석된 내용을 담은 제목",
      "description": "영업팀장 관점의 전략적 제안 내용",
      "solution": "해당 제품명"
    }
  ]
}

한국어로 응답해주세요.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 경험 많은 영업팀장입니다. 고객사 정보를 분석하여 전략적인 제안 포인트를 생성합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    
    if (!result.proposals || !Array.isArray(result.proposals)) {
      throw new Error('Invalid response format');
    }

    return res.status(200).json({ 
      ok: true, 
      proposals: result.proposals 
    });

  } catch (error) {
    console.error('Generate proposals error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Failed to generate proposals' 
    });
  }
}
