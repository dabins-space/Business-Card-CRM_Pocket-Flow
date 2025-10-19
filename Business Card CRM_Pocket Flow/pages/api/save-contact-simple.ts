import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== Simple Save Contact API Handler Started ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    console.log('Request body received:', !!req.body)
    console.log('Body keys:', Object.keys(req.body || {}))
    
    // 간단한 응답 반환
    res.status(200).json({
      ok: true,
      message: 'Simple API test successful',
      receivedData: {
        hasImageBase64: !!req.body?.imageBase64,
        name: req.body?.name,
        company: req.body?.company
      }
    })
    
  } catch (error) {
    console.error('Simple API error:', error)
    res.status(500).json({
      ok: false,
      error: `Simple API error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}
