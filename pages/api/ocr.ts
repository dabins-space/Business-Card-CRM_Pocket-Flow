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

  // 정규식 패턴들을 먼저 정의
  const titleRegex = /(대표|사장|부사장|전무|상무|이사|부장|차장|과장|대리|주임|팀장|실장|원장|교수|CEO|CTO|CFO|COO)/i
  const deptRegex = /(부|팀|실|센터|연구소|사업부|영업부|마케팅|개발|기획|인사|총무|재무|회계|본부|Department|Dept)/i
  // 회사명 관련 키워드들 (OCR 인식 오류 고려)
  const companyKeywords = [
    // 국문 기업 형태 (다양한 OCR 인식 패턴 포함)
    "㈜", "(주)", "주)", "주(", "주식회사",
    "(유)", "유)", "유(", "유한회사", "유한책임회사",
    "합자회사", "합명회사",
    // 단체·기관
    "(사)", "사)", "(재)", "재)", "사단법인", "재단법인",
    "협동조합", "협회", "조합", "공사", "공단", "센터", "연구소", "연구원",
    "본부", "재단", "학교", "대학", "병원", "의원", "학회", "학원",
    // 영문
    "Co., Ltd.", "Ltd.", "Inc.", "Corp.", "Corporation", "LLC", "LLP",
    "Foundation", "Association", "Institute", "Society", "GmbH", "S.A.", "Pte. Ltd.", "Pty Ltd.",
    "KK", "Co Ltd", "Co.Ltd",
    // OCR 인식 오류로 인한 변형들
    "주", "사", "재", "회사", "기업", "그룹", "Group", "Company", "Corp", "Inc", "Ltd"
  ]
  
  // 회사명 정규식 패턴 생성 (특수문자 이스케이프)
  const escapedKeywords = companyKeywords.map(keyword => 
    keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  )
  const companyRegex = new RegExp(`(${escapedKeywords.join('|')})`, 'i')

  // Name: 개선된 이름 추출 로직
  if (lines.length) {
    // 한국어 이름 패턴 (2-4글자)
    const koreanNameRegex = /^[가-힣]{2,4}$/
    
    // 이름 후보들을 수집
    const nameCandidates: string[] = []
    
    for (const line of lines) {
      // 한국어 이름 패턴이고, 이메일이나 전화번호가 아닌 경우
      if (koreanNameRegex.test(line) && 
          !line.includes('@') &&
          !line.match(/[0-9+\-\s]/) &&
          !companyRegex.test(line) &&
          !titleRegex.test(line) &&
          !deptRegex.test(line)) {
        nameCandidates.push(line)
      }
    }
    
    // 이름 후보가 있으면 첫 번째를 선택
    if (nameCandidates.length > 0) {
      fields.name = nameCandidates[0]
      console.log('Found name:', fields.name)
    } else if (lines.length > 0) {
      // 이름을 찾지 못한 경우 첫 번째 줄이 회사명이 아닌지 확인
      const firstLine = lines[0]
      if (!companyRegex.test(firstLine) && 
          !firstLine.includes('@') && 
          !firstLine.match(/^[0-9+\-\s]+$/)) {
        fields.name = firstLine
        console.log('Using first line as name:', fields.name)
      }
    }
  }

  // Title - 간단한 패턴
  for (const line of lines) {
    if (titleRegex.test(line)) {
      fields.title = line
      console.log('Found title:', fields.title)
      break
    }
  }

  // Department - 간단한 패턴
  for (const line of lines) {
    if (deptRegex.test(line)) {
      fields.department = line
      console.log('Found department:', fields.department)
      break
    }
  }

  // Company indicators - 개선된 패턴
  const companyCandidates: { line: string, score: number }[] = []
  
  for (const line of lines) {
    if (companyRegex.test(line)) {
      // 회사명 키워드 개수로 점수 계산
      let score = 0
      for (const keyword of companyKeywords) {
        if (line.includes(keyword)) {
          // 더 명확한 키워드에 높은 점수 부여
          if (['주식회사', '유한회사', 'Corporation', 'Inc.', 'Ltd.'].includes(keyword)) {
            score += 3
          } else if (['(주)', '㈜', 'Corp.', 'LLC', '사단법인', '재단법인'].includes(keyword)) {
            score += 2
          } else {
            score += 1
          }
        }
      }
      companyCandidates.push({ line, score })
      console.log('Company candidate:', line, 'Score:', score)
    }
  }
  
  // 점수가 높은 순으로 정렬하여 가장 적합한 회사명 선택
  if (companyCandidates.length > 0) {
    companyCandidates.sort((a, b) => b.score - a.score)
    fields.company = companyCandidates[0].line
    console.log('Selected company (highest score):', fields.company, 'Score:', companyCandidates[0].score)
  } else {
    // 회사명을 찾지 못한 경우, 더 스마트한 추론
    console.log('No company keywords found, trying smart inference...')
    
    // 알려진 대기업명이나 브랜드명 찾기
    const knownCompanies = [
      '삼성', 'Samsung', 'LG', '현대', 'Hyundai', '기아', 'Kia', 'SK', '롯데', 'Lotte',
      'CJ', 'GS', '한화', 'Hanwha', '두산', 'Doosan', '포스코', 'POSCO', 'KT', 'SKT',
      '네이버', 'Naver', '카카오', 'Kakao', '쿠팡', 'Coupang', '배달의민족', 'Baemin',
      '토스', 'Toss', 'Microsoft', 'Apple', 'Google', 'Amazon', 'Facebook', 'Twitter'
    ]
    
    for (const line of lines) {
      for (const company of knownCompanies) {
        if (line.includes(company)) {
          fields.company = line
          console.log('Found known company:', fields.company)
          break
        }
      }
      if (fields.company) break
    }
    
    // 여전히 찾지 못한 경우 이름이 아닌 첫 번째 줄을 회사명으로 사용
    if (!fields.company) {
      for (const line of lines) {
        if (line !== fields.name && 
            !line.includes('@') && 
            !line.match(/^[0-9+\-\s]+$/) &&
            !titleRegex.test(line) &&
            !deptRegex.test(line)) {
          fields.company = line
          console.log('Using line as company:', fields.company)
          break
        }
      }
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

  // 8자리 (02 지역번호, 일부 번호)
  if (cleaned.length === 8 && cleaned.startsWith('02')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }

  // 11자리 일반 전화번호 (지역번호 3자리)
  if (cleaned.length === 11 && !cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  console.log('Returning original phone:', phone)
  return phone
}
