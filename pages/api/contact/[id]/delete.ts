import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

interface DeleteContactResponse {
  ok: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteContactResponse>
) {
  console.log('=== Delete Contact API Handler Started ===')
  console.log('Method:', req.method)
  console.log('Contact ID:', req.query.id)
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ ok: false, error: 'Contact ID is required' })
  }

  try {
    console.log('Deleting contact from Supabase...')
    
    // 먼저 연락처 정보를 가져와서 이미지 경로 확인
    const { data: contact, error: fetchError } = await supabaseAdmin
      .from('contacts')
      .select('image_path')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError)
      return res.status(500).json({ ok: false, error: `Failed to fetch contact: ${fetchError.message}` })
    }

    if (!contact) {
      return res.status(404).json({ ok: false, error: 'Contact not found' })
    }

    // 연락처 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return res.status(500).json({ ok: false, error: `Failed to delete contact: ${deleteError.message}` })
    }

    // 이미지가 있다면 Storage에서도 삭제
    if (contact.image_path) {
      console.log('Deleting image from storage:', contact.image_path)
      const { error: storageError } = await supabaseAdmin
        .storage
        .from('business-cards')
        .remove([contact.image_path])

      if (storageError) {
        console.warn('Failed to delete image from storage:', storageError)
        // 이미지 삭제 실패는 연락처 삭제를 막지 않음
      }
    }

    console.log('Contact deleted successfully:', id)
    
    res.status(200).json({
      ok: true
    })

  } catch (error) {
    console.error('Delete contact API error:', error)
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
