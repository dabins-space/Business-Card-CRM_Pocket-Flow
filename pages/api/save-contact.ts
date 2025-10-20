import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { v4 as uuidv4 } from 'uuid'

type SaveContactRequest = {
  // 권장: URL만 받기 (Supabase Storage public URL)
  imageUrl?: string

  // 하위호환: 여전히 base64도 허용 (가능하면 사용하지 않기)
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
}

type SaveContactResponse = {
  ok: boolean
  id?: string
  signedUrl?: string
  error?: string
  details?: string
}

// 혹시 남은 base64 요청 대비 완충 (URL만 쓰면 사실 2mb도 넉넉)
export const config = {
  api: { bodyParser: { sizeLimit: '2mb' } },
}

const BUCKET = 'business-cards'

// public URL에서 storage 경로(path)만 추출
function extractPathFromPublicUrl(publicUrl: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return null
  // 예: https://<proj>.supabase.co/storage/v1/object/public/business-cards/<path>
  const prefix = `${base}/storage/v1/object/public/${BUCKET}/`
  if (publicUrl.startsWith(prefix)) return publicUrl.slice(prefix.length)
  return null
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

    /** 1) URL 우선: 이미 Storage에 업로드된 public URL만 받는다 (권장) */
    if (imageUrl) {
      const pathFromUrl = extractPathFromPublicUrl(imageUrl)
      if (!pathFromUrl) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid imageUrl (must be a Supabase public URL for this project)',
        })
      }
      filePath = pathFromUrl
    }

    /** 2) (하위호환) base64가 온 경우에만 서버에서 업로드 수행 */
    else if (imageBase64 && imageExt) {
      const clean = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
      const buffer = Buffer.from(clean, 'base64')

      const now = new Date()
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const fileName = `${uuidv4()}.${imageExt.toLowerCase()}`
      filePath = `anon/${yearMonth}/${fileName}`

      const { error: uploadError } = await supabaseAdmin
        .storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: `image/${imageExt}`,
          upsert: false,
        })

      if (uploadError) {
        return res.status(500).json({
          ok: false,
          error: `Failed to upload image: ${uploadError.message}`,
        })
      }
    } else {
      return res.status(400).json({
        ok: false,
        error: 'imageUrl is required (or imageBase64 + imageExt for legacy)',
      })
    }

    // 3) DB insert
    const { data: inserted, error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        user_id: null, // TODO: 로그인 연동 시 실제 값
        image_path: filePath, // public URL이 아니라 storage 상대경로를 저장
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
      return res.status(500).json({
        ok: false,
        error: `Failed to save contact: ${contactError.message}`,
      })
    }

    // 4) 미리보기용 서명 URL (버킷이 public이어도 유효)
    const { data: signed, error: signedErr } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(filePath!, 60 * 60) // 1시간

    if (signedErr) {
      // 서명 URL 실패는 치명적이지 않으므로 ok: true 로 응답
      return res.status(200).json({ ok: true, id: inserted.id })
    }

    return res.status(200).json({
      ok: true,
      id: inserted.id,
      signedUrl: signed?.signedUrl,
    })
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      details: e?.message || String(e),
    })
  }
}
