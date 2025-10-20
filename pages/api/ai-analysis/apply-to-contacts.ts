import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

interface ApplyAIAnalysisRequest {
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

interface ApplyAIAnalysisResponse {
  ok: boolean;
  updatedContacts?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApplyAIAnalysisResponse>
) {
  console.log('=== Apply AI Analysis to Contacts API Handler Started ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { companyName, analysis }: ApplyAIAnalysisRequest = req.body;

    if (!companyName || !analysis) {
      return res.status(400).json({ ok: false, error: 'Company name and analysis data are required' });
    }

    console.log('Applying AI analysis to contacts for company:', companyName);

    // 해당 회사의 모든 연락처 가져오기
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('contacts')
      .select('id, name, memo')
      .eq('company', companyName);

    if (contactsError) {
      console.error('Failed to fetch contacts:', contactsError);
      return res.status(500).json({ 
        ok: false, 
        error: `Failed to fetch contacts: ${contactsError.message}` 
      });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(404).json({ ok: false, error: 'No contacts found for this company' });
    }

    console.log('Found contacts to update:', contacts.length);

    // AI 분석 결과는 히스토리에만 저장하고 메모에는 추가하지 않음
    console.log('AI analysis results are stored in history only, not in contact memos');
    
    // 연락처 업데이트는 하지 않고 성공 응답만 반환
    let updatedCount = 0;

    console.log('AI analysis applied to contacts successfully:', updatedCount, 'contacts updated');

    res.status(200).json({
      ok: true,
      updatedContacts: updatedCount
    });

  } catch (error) {
    console.error('Apply AI Analysis to Contacts API error:', error);
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
