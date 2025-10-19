import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

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

interface ContactResponse {
  ok: boolean
  contact?: Contact
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>
) {
  console.log('=== Contact Detail API Handler Started ===')
  console.log('Method:', req.method)
  console.log('Contact ID:', req.query.id)
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ ok: false, error: 'Contact ID is required' })
  }

  try {
    console.log('Fetching contact from Supabase...')
    
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ ok: false, error: `Failed to fetch contact: ${error.message}` })
    }

    if (!contact) {
      return res.status(404).json({ ok: false, error: 'Contact not found' })
    }

    console.log('Contact fetched successfully:', contact.name)
    
    res.status(200).json({
      ok: true,
      contact
    })

  } catch (error) {
    console.error('Contact API error:', error)
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
}
