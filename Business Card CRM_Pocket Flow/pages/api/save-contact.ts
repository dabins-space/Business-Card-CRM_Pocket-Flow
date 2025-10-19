import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { v4 as uuidv4 } from 'uuid'

interface SaveContactRequest {
  imageBase64: string
  imageExt: string
  name: string
  title?: string
  department?: string
  company?: string
  email?: string
  phone?: string
  importance: number
  inquiryTypes: string[]
  memo?: string
}

interface SaveContactResponse {
  ok: boolean
  id?: string
  signedUrl?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SaveContactResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const {
      imageBase64,
      imageExt,
      name,
      title,
      department,
      company,
      email,
      phone,
      importance,
      inquiryTypes,
      memo
    }: SaveContactRequest = req.body

    if (!imageBase64 || !name) {
      return res.status(400).json({ ok: false, error: 'Image and name are required' })
    }

    // Generate unique file path
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const fileName = `${uuidv4()}.${imageExt}`
    const filePath = `anon/${yearMonth}/${fileName}`

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('business-cards')
      .upload(filePath, imageBuffer, {
        contentType: `image/${imageExt}`,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ ok: false, error: 'Failed to upload image' })
    }

    // Insert contact record
    const { data: contactData, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        user_id: null, // Anonymous for now
        image_path: filePath,
        name,
        title,
        department,
        company,
        email,
        phone,
        importance,
        inquiry_types: inquiryTypes,
        memo
      })
      .select()
      .single()

    if (contactError) {
      console.error('Contact insert error:', contactError)
      return res.status(500).json({ ok: false, error: 'Failed to save contact' })
    }

    // Generate signed URL for preview
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('business-cards')
      .createSignedUrl(filePath, 3600) // 1 hour

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
    }

    res.status(200).json({
      ok: true,
      id: contactData.id,
      signedUrl: signedUrlData?.signedUrl
    })

  } catch (error) {
    console.error('Save contact error:', error)
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    })
  }
}
