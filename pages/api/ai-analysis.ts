import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { analyzeCompanyWithAI, AIAnalysisRequest } from '../../lib/openai'

interface AIAnalysisAPIRequest {
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
    const { companyName }: AIAnalysisAPIRequest = req.body

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

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ ok: false, error: 'No contacts found for this company' })
    }

    // ChatGPT API를 사용한 실제 AI 분석
    const aiRequest: AIAnalysisRequest = {
      companyName,
      contacts: contacts
    };

    console.log('Starting ChatGPT analysis...');
    console.log('API Key available:', !!process.env.OPENAI_API_KEY);
    console.log('Contacts data:', contacts.length, 'contacts');
    
    const analysis = await analyzeCompanyWithAI(aiRequest);

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

