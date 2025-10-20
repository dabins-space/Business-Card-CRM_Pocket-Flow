import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== Test API Handler Called ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  res.status(200).json({ 
    message: 'Test API is working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })
}
