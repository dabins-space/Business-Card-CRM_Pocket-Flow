import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

interface AddContactHistoryRequest {
  action_type: string; // 'memo_add', 'memo_edit', 'info_update', 'ai_analysis'
  title: string;
  content: string;
  old_value?: string;
  new_value?: string;
}

interface AddContactHistoryResponse {
  ok: boolean;
  history_id?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AddContactHistoryResponse>
) {
  console.log('=== Add Contact History API Handler Started ===');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ ok: false, error: 'Contact ID is required' });
  }

  try {
    const { action_type, title, content, old_value, new_value }: AddContactHistoryRequest = req.body;

    if (!action_type || !title || !content) {
      return res.status(400).json({ ok: false, error: 'action_type, title, and content are required' });
    }

    console.log('Adding contact history for ID:', id);
    console.log('History data:', { action_type, title, content });

    const { data: historyEntry, error } = await supabaseAdmin
      .from('contact_history')
      .insert({
        contact_id: id,
        action_type,
        title,
        content,
        old_value,
        new_value,
        created_by: 'system'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ ok: false, error: `Failed to add contact history: ${error.message}` });
    }

    console.log('Contact history added successfully:', historyEntry.id);

    res.status(200).json({
      ok: true,
      history_id: historyEntry.id
    });

  } catch (error) {
    console.error('Add Contact History API error:', error);
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}