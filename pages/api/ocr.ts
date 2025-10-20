// pages/api/ocr.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getVisionClient } from '../../lib/googleVision'

type OCRFields = {
  name?: string
  title?: string
  department?: string
  company?: string
  email?: string
  phone?: string
}

type OCRResponse = {
  ok: boolean
  fields?: OCRFields
  rawText?: string
  error?: string
  details?: string
}

// (옵션) 혹시 남아 있을 base64 요청 대비하여 여유치
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OCRResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const { imageUrl, imageBase64 } = (req.body || {}) as {
      imageUrl?: string
      imageBase64?: string
    }

    if (!imageUrl && !imageBase64) {
      return res
        .status(400)
        .json({ ok: false, error: 'imageUrl or imageBase64 is required' })
    }

    const visionClient = getVisionClient()

    // ---- URL 우선 사용 (권장 플로우: Storage 업로드 → URL 전달) ----
    let fullText = ''
    if (imageUrl) {
      const [result] = await visionClient.textDetection(imageUrl)
      fullText = result.fullTextAnnotation?.text ?? ''
    } else if (imageBase64) {
      // ---- 하위호환: base64도 허용 ----
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
      })
      fullText = result.fullTextAnnotation?.text ?? ''
    }

    const fields = extractFieldsFromText(fullText)
    return res.status(200).json({ ok: true, fields, rawText: fullText })
  } catch (error: any) {
    const msg = error?.message || 'Failed to process image'
    let finalMsg = 'Failed to process image'
    if (msg.includes('credentials')) finalMsg = 'Google Vision API credentials error'
    else if (msg.includes('quota')) finalMsg = 'Google Vision API quota exceeded'
    else if (msg.includes('permission')) finalMsg = 'Google Vision API permission denied'

    return res.status(500).json({ ok: false, error: finalMsg, details: msg })
  }
}

/* -------------------- Parsing helpers -------------------- */

function extractFieldsFromText(text: string): OCRFields {
  const fields: OCRFields = {}
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // Email
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  const emailMatch = text.match(emailRegex)
  if (emailMatch) fields.email = emailMatch[0]

  // Phone (KR)
  const phoneRegex = /(\+82|0)?[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}/g
  const phoneMatch = text.match(phoneRegex)
  if (phoneMatch) fields.phone = normalizePhone(phoneMatch[0])

  // Company indicators
  const companyRegex = /(주식회사|\(주\)|\(사\)|회사|Corp|Inc|Ltd|Co\.)/i
  for (const line of lines) {
    if (companyRegex.test(line)) {
      fields.company = line
      break
    }
  }

  // Name: 첫 줄(회사줄이 아니면) 또는 다음 줄 추정
  if (!fields.name && lines.length) {
    if (!companyRegex.test(lines[0])) fields.name = lines[0]
    else if (lines[1]) fields.name = lines[1]
  }

  // Title
  const titleRegex = /(대표|사장|부사장|전무|상무|이사|부장|차장|과장|대리|주임|팀장|실장|원장|교수|선생님|님|씨)/i
  for (const line of lines) {
    if (titleRegex.test(line)) {
      fields.title = line
      break
    }
  }

  // Department
  const deptRegex = /(부|팀|실|센터|연구소|사업부|영업부|마케팅|개발|기획|인사|총무|재무|회계)/i
  for (const line of lines) {
    if (deptRegex.test(line)) {
      fields.department = line
      break
    }
  }

  return fields
}

function normalizePhone(phone: string): string {
  // remove non-digits except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // +82 → 0
  if (cleaned.startsWith('+82')) cleaned = '0' + cleaned.slice(3)

  // 010-1234-5678
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  return phone
}
