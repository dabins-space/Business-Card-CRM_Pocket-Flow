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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactsResponse>
) {
  console.log('=== Contacts API Handler Started ===')
  console.log('Method:', req.method)
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    console.log('Fetching contacts from Supabase...')
    
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ ok: false, error: `Failed to fetch contacts: ${error.message}` })
    }

    console.log('Contacts fetched successfully:', contacts?.length || 0)
    
    res.status(200).json({
      ok: true,
      contacts: contacts || []
    })

  } catch (error) {
    console.error('Contacts API error:', error)
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
}
