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
  
  console.log('=== Starting field extraction ===')
  console.log('Input text:', text)
  
  // 텍스트를 줄별로 분리
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  console.log('Lines:', lines)

  // Email - 간단하고 빠른 패턴
  const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
  const emailMatches = text.match(emailRegex)
  if (emailMatches && emailMatches.length > 0) {
    fields.email = emailMatches[0]
    console.log('Found email:', fields.email)
  }

  // Phone - 핸드폰 번호만 (더 포괄적인 패턴)
  const mobilePatterns = [
    /\+82[-.\s]?10[-.\s]?[0-9]{4}[-.\s]?[0-9]{4}/g,  // +82-10-1234-5678, +82.10.1234.5678, +82 10 1234 5678
    /\+8210[0-9]{8}/g,                               // +821012345678
    /010[-.\s]?[0-9]{4}[-.\s]?[0-9]{4}/g,            // 010-1234-5678, 010.1234.5678, 010 1234 5678
    /010[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,            // 010-123-4567, 010.123.4567, 010 123 4567
    /010[0-9]{8}/g,                                   // 01012345678
    /01[0-9][-.\s]?[0-9]{4}[-.\s]?[0-9]{4}/g,        // 011-1234-5678, 016-1234-5678, 017-1234-5678, 018-1234-5678, 019-1234-5678
    /01[0-9][-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,        // 011-123-4567, 016-123-4567, 017-123-4567, 018-123-4567, 019-123-4567
    /01[0-9][0-9]{8}/g,                              // 01112345678, 01612345678, 01712345678, 01812345678, 01912345678
    // 점과 띄어쓰기가 섞인 패턴들
    /010\.\s[0-9]{4}\.\s[0-9]{4}/g,                  // 010. 1234. 5678
    /010\.\s[0-9]{3}\.\s[0-9]{4}/g,                  // 010. 123. 4567
    /01[0-9]\.\s[0-9]{4}\.\s[0-9]{4}/g,              // 011. 1234. 5678, 016. 1234. 5678, 017. 1234. 5678, 018. 1234. 5678, 019. 1234. 5678
    /01[0-9]\.\s[0-9]{3}\.\s[0-9]{4}/g,              // 011. 123. 4567, 016. 123. 4567, 017. 123. 4567, 018. 123. 4567, 019. 123. 4567
    // 점과 여러 띄어쓰기가 섞인 패턴들
    /010\.\s{2,}[0-9]{4}\.\s{2,}[0-9]{4}/g,          // 010.  1234.  5678 (두 번 이상의 띄어쓰기)
    /010\.\s{2,}[0-9]{3}\.\s{2,}[0-9]{4}/g,          // 010.  123.  4567 (두 번 이상의 띄어쓰기)
    /01[0-9]\.\s{2,}[0-9]{4}\.\s{2,}[0-9]{4}/g,      // 01x.  1234.  5678 (두 번 이상의 띄어쓰기)
    /01[0-9]\.\s{2,}[0-9]{3}\.\s{2,}[0-9]{4}/g,      // 01x.  123.  4567 (두 번 이상의 띄어쓰기)
    // 더 복잡한 패턴들 (띄어쓰기 개수 무제한)
    /010[-.\s]*[0-9]{4}[-.\s]*[0-9]{4}/g,            // 010-1234-5678, 010.1234.5678, 010 1234 5678, 010. 1234. 5678, 010- 1234 -5678
    /010[-.\s]*[0-9]{3}[-.\s]*[0-9]{4}/g,            // 010-123-4567, 010.123.4567, 010 123 4567, 010. 123. 4567, 010- 123 -4567
    /01[0-9][-.\s]*[0-9]{4}[-.\s]*[0-9]{4}/g,        // 01x-1234-5678, 01x.1234.5678, 01x 1234 5678, 01x. 1234. 5678
    /01[0-9][-.\s]*[0-9]{3}[-.\s]*[0-9]{4}/g,        // 01x-123-4567, 01x.123.4567, 01x 123 4567, 01x. 123. 4567
    // 앞에 문자가 붙은 패턴들 (유연한 매칭)
    /\b010\.\s{2,}[0-9]{4}\.\s{2,}[0-9]{4}/g,        // M. 010.  1234.  5678 (단어 경계 사용)
    /\b01[0-9]\.\s{2,}[0-9]{4}\.\s{2,}[0-9]{4}/g,    // M. 011.  1234.  5678 (단어 경계 사용)
    /\b010\.\s{2,}[0-9]{3}\.\s{2,}[0-9]{4}/g,        // M. 010.  123.  4567 (단어 경계 사용)
    /\b01[0-9]\.\s{2,}[0-9]{3}\.\s{2,}[0-9]{4}/g,    // M. 011.  123.  4567 (단어 경계 사용)
    // 일반적인 점과 띄어쓰기 패턴 (앞에 문자가 붙은 경우)
    /\b010\.\s[0-9]{4}\.\s[0-9]{4}/g,                // M. 010. 1234. 5678
    /\b010\.\s[0-9]{3}\.\s[0-9]{4}/g,                // M. 010. 123. 4567
    /\b01[0-9]\.\s[0-9]{4}\.\s[0-9]{4}/g,            // M. 011. 1234. 5678
    /\b01[0-9]\.\s[0-9]{3}\.\s[0-9]{4}/g             // M. 011. 123. 4567
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

  // Name: 개선된 이름 추출 (더 포괄적으로)
  
  // 1단계: 한국어 이름 우선 검색 (더 관대한 조건)
  for (const line of lines) {
    // 한국어 이름 패턴 (띄어쓰기 포함)
    const koreanNamePattern = /^[가-힣]{2,4}$|^[가-힣]\s[가-힣]{1,3}$|^[가-힣]{2}\s[가-힣]{1,2}$|^[가-힣]{3}\s[가-힣]$/
    
    if (koreanNamePattern.test(line) && 
        !line.includes('@') &&
        !line.match(/^[0-9+\-\s]+$/) && // 숫자만 있는 줄만 제외
        !companyRegex.test(line) &&
        !titleRegex.test(line) &&
        !deptRegex.test(line)) {
      fields.name = line
      console.log('Found Korean name:', fields.name)
      break
    }
  }
  
  // 2단계: 한국어 이름을 찾지 못한 경우 영어 이름 시도
  if (!fields.name) {
    for (const line of lines) {
      // 영어 이름 패턴 (2-3 단어)
      if (/^[A-Za-z]{2,20}\s+[A-Za-z]{2,20}(\s+[A-Za-z]{2,20})?$/.test(line) &&
          !line.includes('@') &&
          !companyRegex.test(line) &&
          !titleRegex.test(line) &&
          !deptRegex.test(line)) {
        fields.name = line
        console.log('Found English name:', fields.name)
        break
      }
    }
  }
    
  // 3단계: 복합 텍스트에서 이름 추출 시도 (더 관대한 조건)
  if (!fields.name) {
    for (const line of lines) {
      // "김진희 Jinhee Kim" 또는 "권 혁 수" 같은 패턴에서 한국어 이름 추출
      const koreanInLine = line.match(/[가-힣]{2,4}/g)
      const koreanWithSpaceInLine = line.match(/[가-힣]\s[가-힣]{1,3}|[가-힣]{2}\s[가-힣]{1,2}|[가-힣]{3}\s[가-힣]/g)
      
      // 연속된 한국어 이름 조합
      if (koreanInLine && koreanInLine.length > 0) {
        // 더 관대한 필터링 - 기본적인 회사명 키워드만 제외
        const validNames = koreanInLine.filter(name => 
          !name.includes('회사') && 
          !name.includes('기업') &&
          !name.includes('그룹') &&
          !name.includes('센터') &&
          !name.includes('연구') &&
          !name.includes('본부') &&
          !name.includes('부서') &&
          !name.includes('팀') &&
          !name.includes('사장') &&
          !name.includes('부장') &&
          !name.includes('과장') &&
          !name.includes('대리') &&
          !name.includes('팀장')
        )
        if (validNames.length > 0) {
          fields.name = validNames[0]
          console.log('Found name in complex text:', fields.name)
          break
        }
      }
      
      // 띄어쓰기가 있는 한국어 이름
      if (koreanWithSpaceInLine && koreanWithSpaceInLine.length > 0) {
        const validNamesWithSpace = koreanWithSpaceInLine.filter(name => 
          !name.includes('회사') && 
          !name.includes('기업') &&
          !name.includes('그룹') &&
          !name.includes('센터') &&
          !name.includes('연구') &&
          !name.includes('본부') &&
          !name.includes('부서') &&
          !name.includes('팀') &&
          !name.includes('사장') &&
          !name.includes('부장') &&
          !name.includes('과장') &&
          !name.includes('대리') &&
          !name.includes('팀장')
        )
        if (validNamesWithSpace.length > 0) {
          fields.name = validNamesWithSpace[0]
          console.log('Found name with space in complex text:', fields.name)
          break
        }
      }
      
      // 영어 이름도 시도
      const englishInLine = line.match(/[A-Za-z]{2,20}\s+[A-Za-z]{2,20}/g)
      if (englishInLine && englishInLine.length > 0) {
        const validEnglishNames = englishInLine.filter(name => 
          !name.includes('Microsoft') && 
          !name.includes('HelloT') &&
          !name.includes('Company') &&
          !name.includes('Corp') &&
          !name.includes('Inc')
        )
        if (validEnglishNames.length > 0) {
          fields.name = validEnglishNames[0]
          console.log('Found English name in complex text:', fields.name)
          break
        }
      }
    }
  }
    
  // 4단계: 여전히 이름을 찾지 못한 경우 첫 번째 줄 시도 (더 엄격한 조건)
  if (!fields.name && lines.length > 0) {
    const firstLine = lines[0]
    if (!companyRegex.test(firstLine) && 
        !firstLine.includes('@') && 
        !firstLine.match(/^[0-9+\-\s]+$/) &&
        !titleRegex.test(firstLine) &&
        !deptRegex.test(firstLine) &&
        firstLine.length <= 10 && // 너무 긴 줄은 제외
        !firstLine.includes('회사') && // 회사 관련 단어 제외
        !firstLine.includes('기업') &&
        !firstLine.includes('그룹') &&
        !firstLine.includes('Corp') &&
        !firstLine.includes('Inc') &&
        !firstLine.includes('Ltd') &&
        !firstLine.includes('Company')) {
      fields.name = firstLine
      console.log('Using first line as name:', fields.name)
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

  // Company indicators - 점수 기반 시스템
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
    const rawCompanyName = companyCandidates[0].line
    // 기업 형태 키워드 제거하여 순수한 회사명만 추출
    fields.company = cleanCompanyName(rawCompanyName)
    console.log('Selected company (highest score):', rawCompanyName, '-> cleaned:', fields.company, 'Score:', companyCandidates[0].score)
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
          fields.company = cleanCompanyName(line)
          console.log('Found known company:', line, '-> cleaned:', fields.company)
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
          fields.company = cleanCompanyName(line)
          console.log('Using line as company:', line, '-> cleaned:', fields.company)
          break
        }
      }
    }
  }

  return fields
}

function cleanCompanyName(companyName: string): string {
  // 기업 형태 키워드들을 제거하여 순수한 회사명만 추출
  const companyTypeKeywords = [
    // 국문 기업 형태
    '주식회사', '(주)', '㈜', '주)', '주(',
    '(유)', '유)', '유(', '유한회사', '유한책임회사',
    '합자회사', '합명회사',
    // 단체·기관
    '(사)', '사)', '(재)', '재)', '사단법인', '재단법인',
    '협동조합', '협회', '조합', '공사', '공단', '센터', '연구소', '연구원',
    '본부', '재단', '학교', '대학', '병원', '의원', '학회', '학원',
    // 영문
    'Co., Ltd.', 'Ltd.', 'Inc.', 'Corp.', 'Corporation', 'LLC', 'LLP',
    'Foundation', 'Association', 'Institute', 'Society', 'GmbH', 'S.A.', 
    'Pte. Ltd.', 'Pty Ltd.', 'KK', 'Co Ltd', 'Co.Ltd'
  ]
  
  let cleanedName = companyName.trim()
  
  // 키워드들을 제거 (앞뒤로 공백이 있는 경우도 처리)
  for (const keyword of companyTypeKeywords) {
    // 앞뒤 공백과 함께 제거
    const regex = new RegExp(`\\s*${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gi')
    cleanedName = cleanedName.replace(regex, ' ').trim()
    
    // 맨 앞이나 맨 뒤에 있는 경우도 제거
    if (cleanedName.startsWith(keyword)) {
      cleanedName = cleanedName.substring(keyword.length).trim()
    }
    if (cleanedName.endsWith(keyword)) {
      cleanedName = cleanedName.substring(0, cleanedName.length - keyword.length).trim()
    }
  }
  
  // 연속된 공백을 하나로 정리
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim()
  
  return cleanedName || companyName // 빈 문자열이면 원본 반환
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

  // 핸드폰 번호만 처리 (01x로 시작)
  if (cleaned.startsWith('01')) {
    if (cleaned.length === 11) {
      // 010-1234-5678, 011-1234-5678, 016-1234-5678, 017-1234-5678, 018-1234-5678, 019-1234-5678
      const result = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
      console.log('Mobile phone result (11 digits):', result)
      return result
    } else if (cleaned.length === 10) {
      // 010-123-4567, 011-123-4567, 016-123-4567, 017-123-4567, 018-123-4567, 019-123-4567
      const result = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      console.log('Mobile phone result (10 digits):', result)
      return result
    }
  }

  console.log('Mobile phone not found, returning original:', cleaned)
  return cleaned
}
