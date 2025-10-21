import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface SaveAIAnalysisRequest {
  companyName: string;
  analysis: {
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
  };
}

interface SaveAIAnalysisResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveAIAnalysisResponse>
) {
  console.log('=== Save AI Analysis API Handler Started ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { companyName, analysis }: SaveAIAnalysisRequest = req.body;

    if (!companyName || !analysis) {
      return res.status(400).json({ ok: false, error: 'Company name and analysis data are required' });
    }

    console.log('Saving AI analysis for company:', companyName);

    // AI 분석 결과를 데이터베이스에 저장
    const { data: savedAnalysis, error } = await supabaseAdmin
      .from('ai_analysis_history')
      .insert({
        company_name: companyName,
        analysis_data: analysis,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase save error:', error);
      
      // 테이블이 존재하지 않는 경우 특별한 오류 메시지
      if (error.message.includes('relation "ai_analysis_history" does not exist')) {
        return res.status(500).json({ 
          ok: false, 
          error: 'AI 분석 히스토리 테이블이 존재하지 않습니다. 관리자에게 문의하세요.' 
        });
      }
      
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to save AI analysis: ${error.message}` 
      });
    }

    console.log('AI analysis saved successfully:', savedAnalysis.id);

    // AI 분석 결과는 히스토리에만 저장하고 연락처 메모에는 추가하지 않음
    console.log('AI analysis saved to history only, not added to contact memos');

    res.status(200).json({
      ok: true,
      id: savedAnalysis.id
    });

  } catch (error) {
    console.error('Save AI Analysis API error:', error);
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
