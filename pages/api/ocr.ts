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
      const [result] = await visionClient.textDetection({
        image: { source: { imageUri: imageUrl } }
      })
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

    console.log('OCR Raw Text:', fullText)
    const fields = extractFieldsFromText(fullText)
    console.log('Extracted Fields:', fields)
    return res.status(200).json({ ok: true, fields, rawText: fullText })
  } catch (error: any) {
    console.error('OCR API Error:', error)
    const msg = error?.message || 'Failed to process image'
    let finalMsg = 'Failed to process image'
    
    if (msg.includes('credentials') || msg.includes('authentication')) {
      finalMsg = 'Google Vision API 인증 오류 - 서비스 계정 설정을 확인해주세요'
    } else if (msg.includes('quota') || msg.includes('limit')) {
      finalMsg = 'Google Vision API 할당량 초과 - 잠시 후 다시 시도해주세요'
    } else if (msg.includes('permission') || msg.includes('forbidden')) {
      finalMsg = 'Google Vision API 권한 오류 - API 권한을 확인해주세요'
    } else if (msg.includes('network') || msg.includes('timeout')) {
      finalMsg = '네트워크 오류 - 인터넷 연결을 확인해주세요'
    } else if (msg.includes('invalid') || msg.includes('format')) {
      finalMsg = '이미지 형식 오류 - 지원되는 이미지 형식인지 확인해주세요'
    }

    return res.status(500).json({ ok: false, error: finalMsg, details: msg })
  }
}

/* -------------------- Parsing helpers -------------------- */

function extractFieldsFromText(text: string): OCRFields {
  const fields: OCRFields = {}
  
  // 텍스트를 줄별로 분리
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  console.log('Original text:', text)
  console.log('Lines:', lines)

  // Email - 개선된 패턴
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
  const emailMatches = text.match(emailRegex)
  if (emailMatches && emailMatches.length > 0) {
    // 가장 일반적인 이메일 형식 선택 (gmail, naver, daum 등)
    const commonDomains = ['gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'yahoo.com', 'hotmail.com']
    const preferredEmail = emailMatches.find(email => 
      commonDomains.some(domain => email.toLowerCase().includes(domain))
    )
    fields.email = preferredEmail || emailMatches[0]
    console.log('Found email:', fields.email)
  }

  // Phone (KR) - 핸드폰 번호 우선 분석
  // 다양한 핸드폰 번호 패턴
  const mobilePatterns = [
    /\+82[-.\s]?10[-.\s]?[0-9]{4}[-.\s]?[0-9]{4}/g,  // +82-10-1234-5678
    /010[-.\s]?[0-9]{4}[-.\s]?[0-9]{4}/g,            // 010-1234-5678
    /010[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,            // 010-123-4567
    /010[0-9]{8}/g,                                   // 01012345678
    /\+8210[0-9]{8}/g,                               // +821012345678
    /\+82[0-9]{11}/g,                                // +821098765432 (연속된 숫자)
  ]
  
  let phoneFound = false
  for (const pattern of mobilePatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      fields.phone = normalizePhone(matches[0])
      phoneFound = true
      console.log('Found mobile phone:', matches[0], '->', fields.phone)
      break
    }
  }
  
  // 핸드폰을 찾지 못한 경우 일반 전화번호 패턴 시도
  if (!phoneFound) {
    const phoneRegex = /(\+82|0)?[0-9]{2,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4}/g
    const phoneMatch = text.match(phoneRegex)
    if (phoneMatch) {
      fields.phone = normalizePhone(phoneMatch[0])
      console.log('Found general phone:', phoneMatch[0], '->', fields.phone)
    }
  }

  // Name: 간단한 이름 추출 로직 (먼저 실행)
  if (lines.length) {
    // 한국어 이름 패턴 (2-4글자)
    const koreanNameRegex = /^[가-힣]{2,4}$/
    
    for (const line of lines) {
      // 한국어 이름 패턴이고, 이메일이나 전화번호가 아닌 경우
      if (koreanNameRegex.test(line) && 
          !line.includes('@') &&
          !line.match(/[0-9+\-\s]/)) {
        fields.name = line
        console.log('Found name:', fields.name)
        break
      }
    }
    
    // 이름을 찾지 못한 경우 첫 번째 줄 사용
    if (!fields.name && lines.length > 0) {
      fields.name = lines[0]
      console.log('Using first line as name:', fields.name)
    }
  }

  // Title - 간단한 패턴
  const titleRegex = /(대표|사장|부사장|전무|상무|이사|부장|차장|과장|대리|주임|팀장|실장|원장|교수|CEO|CTO|CFO|COO)/i
  for (const line of lines) {
    if (titleRegex.test(line)) {
      fields.title = line
      console.log('Found title:', fields.title)
      break
    }
  }

  // Department - 간단한 패턴
  const deptRegex = /(부|팀|실|센터|연구소|사업부|영업부|마케팅|개발|기획|인사|총무|재무|회계|본부|Department|Dept)/i
  for (const line of lines) {
    if (deptRegex.test(line)) {
      fields.department = line
      console.log('Found department:', fields.department)
      break
    }
  }

  // Company indicators - 간단한 패턴
  const companyRegex = /(주식회사|\(주\)|\(사\)|회사|Corp|Inc|Ltd|Co\.|㈜|Group|그룹|기업)/i
  for (const line of lines) {
    if (companyRegex.test(line)) {
      fields.company = line
      console.log('Found company:', fields.company)
      break
    }
  }
  
  // 회사명을 찾지 못한 경우, 첫 번째 줄이 회사명일 가능성 체크
  if (!fields.company && lines.length > 0) {
    const firstLine = lines[0]
    // 이메일이나 전화번호가 아닌 경우
    if (!firstLine.includes('@') && !firstLine.match(/^[0-9+\-\s]+$/)) {
      fields.company = firstLine
      console.log('Using first line as company:', fields.company)
    }
  }

  return fields
}

function normalizePhone(phone: string): string {
  console.log('Normalizing phone:', phone)
  
  // remove non-digits except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  console.log('Cleaned phone:', cleaned)

  // +82-10 → 010 변환
  if (cleaned.startsWith('+8210')) {
    cleaned = '010' + cleaned.slice(4)
    console.log('Converted +8210 to 010:', cleaned)
  } else if (cleaned.startsWith('+82')) {
    cleaned = '0' + cleaned.slice(3)
    console.log('Converted +82 to 0:', cleaned)
  }

  console.log('After +82 conversion:', cleaned)

  // 핸드폰 번호 우선 처리 (010으로 시작)
  if (cleaned.startsWith('010')) {
    if (cleaned.length === 11) {
      // 010-1234-5678
      const result = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
      console.log('Mobile phone result:', result)
      return result
    } else if (cleaned.length === 10) {
      // 010-123-4567 (일부 번호)
      const result = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      console.log('Mobile phone result (10 digits):', result)
      return result
    }
  }

  // 일반 전화번호 처리
  // 02-1234-5678 (10자리 서울)
  if (cleaned.length === 10 && cleaned.startsWith('02')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  // 기타 지역번호 (10자리)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // 9자리 (02 지역번호)
  if (cleaned.length === 9 && cleaned.startsWith('02')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }

  console.log('Returning original phone:', phone)
  return phone
}
