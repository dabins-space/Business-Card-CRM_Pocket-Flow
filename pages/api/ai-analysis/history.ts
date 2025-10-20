import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface AIAnalysisHistoryItem {
  id: string;
  company_name: string;
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

interface AIAnalysisHistoryResponse {
  ok: boolean;
  history?: AIAnalysisHistoryItem[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIAnalysisHistoryResponse>
) {
  console.log('=== AI Analysis History API Handler Started ===');
  console.log('Method:', req.method);

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    console.log('Fetching AI analysis history...');

    // AI 분석 히스토리를 최신순으로 조회
    const { data: history, error } = await supabaseAdmin
      .from('ai_analysis_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to fetch AI analysis history: ${error.message}` 
      });
    }

    console.log('AI analysis history fetched successfully:', history?.length || 0, 'items');

    res.status(200).json({
      ok: true,
      history: history || []
    });

  } catch (error) {
    console.error('AI Analysis History API error:', error);
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
