import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { v4 as uuidv4 } from 'uuid'

type SaveContactRequest = {
  imageUrl?: string
  imageBase64?: string
  imageExt?: string
  name: string
  title?: string
  department?: string
  company?: string
  email?: string
  phone?: string
  importance: number
  inquiryTypes: string[]
  memo?: string
  details?: string
}

type SaveContactResponse = {
  ok: boolean
  contactId?: string
  error?: string
}

export const config = {
  api: { bodyParser: { sizeLimit: '2mb' } },
}

const BUCKET = 'business-cards'

// public URL에서 storage 경로(path)만 추출
function extractPathFromPublicUrl(publicUrl: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  const prefix = `${base}/storage/v1/object/public/${BUCKET}/`
  if (publicUrl.startsWith(prefix)) return publicUrl.slice(prefix.length)
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SaveContactResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    console.log('=== Save Contact API Debug ===');
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    let userId = null;
    
    console.log('Authorization header:', authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Token extracted:', token.substring(0, 20) + '...');
      try {
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
    
    console.log('Final user ID:', userId);

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    const {
      imageUrl,
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
      memo,
    } = (req.body || {}) as SaveContactRequest

    if (!name) {
      return res.status(400).json({ ok: false, error: 'name is required' })
    }

    let filePath: string | null = null

    // 1. imageUrl이 있으면 그대로 사용 (이미 업로드된 파일)
    if (imageUrl) {
      filePath = extractPathFromPublicUrl(imageUrl)
      if (!filePath) {
        return res.status(400).json({ ok: false, error: 'Invalid image URL' })
      }
    }
    // 2. imageBase64가 있으면 새로 업로드
    else if (imageBase64 && imageExt) {
      try {
        const buffer = Buffer.from(imageBase64, 'base64')
        const fileName = `${uuidv4()}.${imageExt}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(fileName, buffer, {
            contentType: `image/${imageExt}`,
            upsert: false,
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          return res.status(500).json({ ok: false, error: `Upload failed: ${uploadError.message}` })
        }

        filePath = uploadData.path
        console.log('File uploaded successfully:', filePath)
      } catch (error) {
        console.error('Upload processing error:', error)
        return res.status(500).json({ ok: false, error: 'Failed to process image upload' })
      }
    }

    // DB insert (사용자 ID 포함)
    const { data: inserted, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        user_id: userId, // 로그인한 사용자 ID
        image_path: filePath,
        name,
        title,
        department,
        company,
        email,
        phone,
        importance,
        inquiry_types: inquiryTypes,
        memo,
      })
      .select()
      .single()

    if (contactError) {
      console.error('Database insert error:', contactError)
      return res.status(500).json({
        ok: false,
        error: `Failed to save contact: ${contactError.message}`
      })
    }

    console.log('Contact saved successfully:', inserted.id);

    res.status(200).json({
      ok: true,
      contactId: inserted.id
    })

  } catch (error) {
    console.error('Save contact error:', error)
    res.status(500).json({
      ok: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}