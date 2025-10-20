import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface GetLatestAIAnalysisRequest {
  companyName: string;
}

interface GetLatestAIAnalysisResponse {
  ok: boolean;
  analysis?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetLatestAIAnalysisResponse>
) {
  console.log('=== Get Latest AI Analysis API Handler Started ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { companyName }: GetLatestAIAnalysisRequest = req.body;

    if (!companyName) {
      return res.status(400).json({ ok: false, error: 'Company name is required' });
    }

    console.log('Getting latest AI analysis for company:', companyName);

    // 해당 회사의 가장 최근 AI 분석 결과 가져오기
    const { data: latestAnalysis, error } = await supabaseAdmin
      .from('ai_analysis_history')
      .select('*')
      .eq('company_name', companyName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우
        console.log('No AI analysis found for company:', companyName);
        return res.status(404).json({ ok: false, error: 'No AI analysis found for this company' });
      }
      
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to fetch AI analysis: ${error.message}` 
      });
    }

    console.log('Latest AI analysis found:', latestAnalysis.id);

    res.status(200).json({
      ok: true,
      analysis: {
        ...latestAnalysis.analysis_data,
        lastAnalyzed: new Date(latestAnalysis.created_at).toLocaleDateString('ko-KR'),
        analysisId: latestAnalysis.id
      }
    });

  } catch (error) {
    console.error('Get Latest AI Analysis API error:', error);
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
