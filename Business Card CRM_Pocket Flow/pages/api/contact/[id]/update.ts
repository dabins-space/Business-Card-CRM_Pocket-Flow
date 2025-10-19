import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

interface UpdateContactRequest {
  name?: string
  title?: string
  department?: string
  company?: string
  email?: string
  phone?: string
  importance?: number
  inquiry_types?: string[]
  memo?: string
}

interface UpdateContactResponse {
  ok: boolean
  contact?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateContactResponse>
) {
  console.log('=== Update Contact API Handler Started ===')
  console.log('Method:', req.method)
  console.log('Contact ID:', req.query.id)
  
  if (req.method !== 'PUT') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ ok: false, error: 'Contact ID is required' })
  }

  try {
    const updateData: UpdateContactRequest = req.body
    console.log('Update data:', updateData)

    // 빈 값들은 제거
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    )

    console.log('Cleaned update data:', cleanedData)

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return res.status(500).json({ ok: false, error: `Failed to update contact: ${error.message}` })
    }

    if (!contact) {
      return res.status(404).json({ ok: false, error: 'Contact not found' })
    }

    console.log('Contact updated successfully:', contact.name)
    
    res.status(200).json({
      ok: true,
      contact
    })

  } catch (error) {
    console.error('Update contact API error:', error)
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error.message || 'Unknown error'}`
    })
  }
}
