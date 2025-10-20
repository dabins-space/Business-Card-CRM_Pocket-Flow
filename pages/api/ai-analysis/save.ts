import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface SaveAIAnalysisRequest {
  companyName: string;
  analysis: {
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
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to save AI analysis: ${error.message}` 
      });
    }

    console.log('AI analysis saved successfully:', savedAnalysis.id);

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
