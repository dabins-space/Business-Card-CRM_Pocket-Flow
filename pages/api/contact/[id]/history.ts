import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

interface ContactHistoryEntry {
  id: string;
  contact_id: string;
  action_type: string;
  title: string;
  content: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  created_by: string;
}

interface GetContactHistoryResponse {
  ok: boolean;
  history?: ContactHistoryEntry[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetContactHistoryResponse>
) {
  console.log('=== Get Contact History API Handler Started ===');
  console.log('Method:', req.method);

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ ok: false, error: 'Contact ID is required' });
  }

  try {
    console.log('Fetching contact history for ID:', id);

    const { data: history, error } = await supabaseAdmin
      .from('contact_history')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ ok: false, error: `Failed to fetch contact history: ${error.message}` });
    }

    console.log('Contact history fetched successfully:', history?.length || 0);

    res.status(200).json({
      ok: true,
      history: history || []
    });

  } catch (error) {
    console.error('Get Contact History API error:', error);
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}