import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

interface AIAnalysisRequest {
  companyName: string
}

interface AIAnalysisResponse {
  ok: boolean
  analysis?: {
    company: string
    overview: string
    industry: string
    employees: string
    founded: string
    website: string
    opportunities: Array<{
      id: number
      title: string
      description: string
      priority: string
      impact: string
      timeline: string
    }>
    proposalPoints: string[]
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIAnalysisResponse>
) {
  console.log('=== AI Analysis API Handler Started ===')
  console.log('Method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const { companyName }: AIAnalysisRequest = req.body

    if (!companyName) {
      return res.status(400).json({ ok: false, error: 'Company name is required' })
    }

    console.log('Analyzing company:', companyName)

    // 해당 회사의 연락처 정보 가져오기
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('company', companyName)

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ ok: false, error: `Failed to fetch contacts: ${error instanceof Error ? error.message : 'Unknown error'}` })
    }

    console.log('Found contacts:', contacts?.length || 0)

    // 실제 데이터를 기반으로 AI 분석 결과 생성
    const analysis = generateAIAnalysis(companyName, contacts || [])

    console.log('AI analysis completed for:', companyName)
    
    res.status(200).json({
      ok: true,
      analysis
    })

  } catch (error) {
    console.error('AI Analysis API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${errorMessage}`
    })
  }
}

function generateAIAnalysis(companyName: string, contacts: any[]) {
  // 실제 연락처 데이터를 기반으로 분석 결과 생성
  const contactCount = contacts.length
  const positions = contacts.map(c => c.title).filter(Boolean)
  const departments = contacts.map(c => c.department).filter(Boolean)
  const inquiryTypes = contacts.flatMap(c => c.inquiry_types || [])

  // 회사 규모 추정
  let employees = "10-50명"
  if (contactCount > 5) employees = "50-100명"
  if (contactCount > 10) employees = "100-500명"
  if (contactCount > 20) employees = "500명 이상"

  // 산업 추정 (직책과 부서 기반)
  let industry = "IT/소프트웨어"
  if (departments.some(d => d.includes('마케팅') || d.includes('영업'))) {
    industry = "마케팅/영업"
  }
  if (departments.some(d => d.includes('금융') || d.includes('재무'))) {
    industry = "금융/핀테크"
  }
  if (departments.some(d => d.includes('제조') || d.includes('생산'))) {
    industry = "제조업"
  }

  // 개요 생성
  const overview = `${companyName}은(는) ${industry} 분야에서 활동하는 회사로, 현재 ${contactCount}명의 연락처가 등록되어 있습니다. 주요 직책으로는 ${positions.slice(0, 3).join(', ')} 등이 있으며, ${departments.length > 0 ? departments.slice(0, 2).join(', ') + ' 부서' : '다양한 부서'}에서 활동하고 있습니다.`

  // 비즈니스 기회 생성
  const opportunities = [
    {
      id: 1,
      title: "기술 협력 및 파트너십",
      description: `${companyName}의 ${positions[0] || '주요 담당자'}와의 기술적 협력 기회를 모색할 수 있습니다.`,
      priority: "high",
      impact: "높음",
      timeline: "1-2개월"
    },
    {
      id: 2,
      title: "신규 프로젝트 제안",
      description: `등록된 문의 유형(${inquiryTypes.slice(0, 2).join(', ')})을 바탕으로 맞춤형 솔루션을 제안할 수 있습니다.`,
      priority: "medium",
      impact: "중간",
      timeline: "2-3개월"
    },
    {
      id: 3,
      title: "장기적 비즈니스 관계 구축",
      description: `${contactCount}명의 다양한 연락처를 활용하여 장기적인 비즈니스 관계를 구축할 수 있습니다.`,
      priority: "medium",
      impact: "중간",
      timeline: "3-6개월"
    }
  ]

  // 제안 포인트 생성
  const proposalPoints = [
    `${companyName}의 ${industry} 전문성을 활용한 시너지 창출`,
    `${contactCount}명의 연락처 네트워크를 통한 확장 가능성`,
    `${inquiryTypes.length > 0 ? inquiryTypes.slice(0, 2).join(', ') + ' 관련' : '다양한'} 프로젝트 협업 기회`
  ]

  return {
    company: companyName,
    overview,
    industry,
    employees,
    founded: "정보 없음",
    website: "정보 없음",
    opportunities,
    proposalPoints
  }
}
