import { NextApiRequest, NextApiResponse } from 'next'
import { getVisionClient } from '../../lib/googleVision'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== Test OCR API Handler Started ===')
  console.log('Method:', req.method)
  
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    console.log('Testing Google Vision API connection...')
    
    // Vision 클라이언트 초기화 테스트
    const visionClient = getVisionClient()
    console.log('Vision client initialized successfully')
    
    // 간단한 테스트 이미지 (1x1 픽셀 PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    const imageBuffer = Buffer.from(testImageBase64, 'base64')
    
    console.log('Testing text detection with minimal image...')
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer }
    })
    
    console.log('Vision API test successful')
    console.log('Result:', result)
    
    res.status(200).json({
      ok: true,
      message: 'Google Vision API is working correctly',
      detections: result.textAnnotations?.length || 0
    })

  } catch (error) {
    console.error('Test OCR Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : 'Unknown'
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    })
    
    res.status(500).json({
      ok: false,
      error: 'Google Vision API test failed',
      details: errorMessage
    })
  }
}
