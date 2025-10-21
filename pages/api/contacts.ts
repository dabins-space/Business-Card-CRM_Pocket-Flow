import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

interface Contact {
  id: string
  user_id: string | null
  image_path: string
  name: string
  title?: string
  department?: string
  company?: string
  email?: string
  phone?: string
  importance: number
  inquiry_types: string[]
  memo?: string
  created_at: string
  updated_at: string
}

interface ContactsResponse {
  ok: boolean
  contacts?: Contact[]
  error?: string
}

// 인증 토큰에서 사용자 정보 추출
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    let userId = null;
    
    console.log('=== Contacts API Debug ===');
    console.log('Authorization header:', authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Token extracted:', token.substring(0, 20) + '...');
      try {
        // Supabase에서 토큰 검증
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (user && !error) {
          userId = user.id;
          console.log('User ID extracted:', userId);
        } else {
          console.log('User extraction failed:', error);
        }
      } catch (error) {
        console.log('토큰 검증 실패:', error);
      }
    } else {
      console.log('No valid authorization header found');
    }
    
    console.log('Final user ID for contacts:', userId);

    // 사용자 ID가 없으면 빈 배열 반환
    if (!userId) {
      return res.status(200).json({
        ok: true,
        contacts: []
      });
    }

    // 해당 사용자의 연락처만 조회
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ ok: false, error: `Failed to fetch contacts: ${error.message}` })
    }

    res.status(200).json({
      ok: true,
      contacts: contacts || []
    })

  } catch (error) {
    console.error('Contacts API error:', error)
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
