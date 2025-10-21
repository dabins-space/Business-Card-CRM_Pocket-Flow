import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface SaveProposalsRequest {
  companyName: string;
  proposalPoints: Array<{
    id: number;
    title: string;
    description: string;
    solution: string;
  }>;
}

interface SaveProposalsResponse {
  ok: boolean;
  id?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveProposalsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { companyName, proposalPoints }: SaveProposalsRequest = req.body;

    if (!companyName || !proposalPoints || !Array.isArray(proposalPoints)) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    // 제안 포인트를 JSON으로 저장
    const { data: inserted, error } = await supabaseAdmin
      .from('ai_analysis_history')
      .insert({
        company_name: companyName,
        analysis_data: JSON.stringify({
          proposalPoints: proposalPoints
        }),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to save proposals: ${error.message}` 
      });
    }

    return res.status(200).json({ 
      ok: true, 
      id: inserted.id 
    });

  } catch (error) {
    console.error('Save proposals error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}
