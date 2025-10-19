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
  console.log('=== Save Contact API Handler Started ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', req.headers)
  
  // 환경 변수 확인
  console.log('Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  if (req.method !== 'POST') {
    console.log('Method not allowed, returning 405')
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

    console.log('Save Contact API received data:', {
      imageBase64Length: imageBase64?.length,
      imageExt,
      name,
      title,
      department,
      company,
      email,
      phone,
      importance,
      inquiryTypes,
      memoLength: memo?.length
    })

    if (!imageBase64 || !name) {
      console.log('Save Contact API: Missing required fields')
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
    console.log('Save Contact API: Uploading to Supabase Storage')
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('business-cards')
      .upload(filePath, imageBuffer, {
        contentType: `image/${imageExt}`,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ ok: false, error: `Failed to upload image: ${uploadError.message}` })
    }
    
    console.log('Save Contact API: Upload successful:', uploadData)

    // Insert contact record
    console.log('Save Contact API: Inserting contact record')
    const contactRecord = {
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
    }
    
    console.log('Save Contact API: Contact record data:', contactRecord)
    
    const { data: contactData, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert(contactRecord)
      .select()
      .single()

    if (contactError) {
      console.error('Contact insert error:', contactError)
      return res.status(500).json({ ok: false, error: `Failed to save contact: ${contactError.message}` })
    }
    
    console.log('Save Contact API: Contact insert successful:', contactData)

    // Generate signed URL for preview
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('business-cards')
      .createSignedUrl(filePath, 3600) // 1 hour

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
    }

    console.log('=== Save Contact API Success ===')
    res.status(200).json({
      ok: true,
      id: contactData.id,
      signedUrl: signedUrlData?.signedUrl
    })

  } catch (error) {
    console.error('Save contact error:', error)
    
    // Ensure we always return JSON, not HTML
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
}
