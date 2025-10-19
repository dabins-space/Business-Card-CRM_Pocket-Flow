import { NextApiRequest, NextApiResponse } from 'next'
import { getVisionClient } from '../../lib/googleVision'

interface OCRResponse {
  ok: boolean
  fields?: {
    name?: string
    title?: string
    department?: string
    company?: string
    email?: string
    phone?: string
  }
  rawText?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OCRResponse>
) {
  console.log('OCR API called with method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const { imageBase64 } = req.body
    console.log('OCR API received imageBase64 length:', imageBase64?.length)

    if (!imageBase64) {
      console.log('OCR API: No imageBase64 provided')
      return res.status(400).json({ ok: false, error: 'Image is required' })
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    console.log('OCR API: Getting Vision client')
    const visionClient = getVisionClient()
    console.log('OCR API: Calling Vision API')
    
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer }
    })

    const detections = result.textAnnotations
    console.log('OCR API: Detections count:', detections?.length || 0)
    
    if (!detections || detections.length === 0) {
      console.log('OCR API: No text detected')
      return res.status(200).json({
        ok: true,
        fields: {},
        rawText: ''
      })
    }

    const fullText = detections[0].description || ''
    console.log('OCR API: Extracted text:', fullText)
    
    const extractedFields = extractFieldsFromText(fullText)
    console.log('OCR API: Extracted fields:', extractedFields)

    res.status(200).json({
      ok: true,
      fields: extractedFields,
      rawText: fullText
    })

  } catch (error) {
    console.error('OCR Error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // 더 구체적인 에러 메시지 제공
    let errorMessage = 'Failed to process image'
    if (error.message.includes('credentials')) {
      errorMessage = 'Google Vision API credentials error'
    } else if (error.message.includes('quota')) {
      errorMessage = 'Google Vision API quota exceeded'
    } else if (error.message.includes('permission')) {
      errorMessage = 'Google Vision API permission denied'
    }
    
    res.status(500).json({
      ok: false,
      error: errorMessage,
      details: error.message
    })
  }
}

function extractFieldsFromText(text: string) {
  const fields: any = {}

  // Email extraction
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  const emailMatch = text.match(emailRegex)
  if (emailMatch) {
    fields.email = emailMatch[0]
  }

  // Phone extraction (Korean format)
  const phoneRegex = /(\+82|0)?[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}/g
  const phoneMatch = text.match(phoneRegex)
  if (phoneMatch) {
    fields.phone = normalizePhone(phoneMatch[0])
  }

  // Company extraction (look for common company indicators)
  const companyRegex = /(주식회사|(주)|(사)|(회사)|(Corp)|(Inc)|(Ltd)|(Co\.))/gi
  const lines = text.split('\n')
  
  for (const line of lines) {
    if (companyRegex.test(line)) {
      fields.company = line.trim()
      break
    }
  }

  // Name extraction (usually the first line or after company)
  if (!fields.name) {
    const cleanLines = lines.filter(line => line.trim().length > 0)
    if (cleanLines.length > 0) {
      // Skip if first line looks like company
      if (!companyRegex.test(cleanLines[0])) {
        fields.name = cleanLines[0].trim()
      } else if (cleanLines.length > 1) {
        fields.name = cleanLines[1].trim()
      }
    }
  }

  // Title extraction (look for common title keywords)
  const titleRegex = /(대표|사장|부사장|전무|상무|이사|부장|차장|과장|대리|주임|팀장|실장|원장|교수|선생님|님|씨)/gi
  for (const line of lines) {
    if (titleRegex.test(line) && !fields.title) {
      fields.title = line.trim()
      break
    }
  }

  // Department extraction
  const deptRegex = /(부|팀|실|센터|연구소|사업부|영업부|마케팅|개발|기획|인사|총무|재무|회계)/gi
  for (const line of lines) {
    if (deptRegex.test(line) && !fields.department) {
      fields.department = line.trim()
      break
    }
  }

  return fields
}

function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Handle Korean phone numbers
  if (cleaned.startsWith('+82')) {
    cleaned = '0' + cleaned.slice(3)
  }
  
  // Format as 010-1234-5678
  if (cleaned.length === 11 && cleaned.startsWith('010')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  return phone // Return original if can't normalize
}
