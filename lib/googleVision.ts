import { ImageAnnotatorClient } from '@google-cloud/vision'

let visionClient: ImageAnnotatorClient | null = null

export const getVisionClient = (): ImageAnnotatorClient => {
  if (!visionClient) {
    console.log('=== Initializing Google Vision Client ===')
    
    const credentialsB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64
    console.log('Credentials B64 length:', credentialsB64?.length || 0)
    
    if (!credentialsB64) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS_B64 environment variable is missing')
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_B64 environment variable is required')
    }

    try {
      console.log('Parsing credentials...')
      const credentials = JSON.parse(Buffer.from(credentialsB64, 'base64').toString())
      console.log('Credentials parsed successfully, project_id:', credentials.project_id)
      
      visionClient = new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id,
        fallback: true, // ✅ 이 한 줄 추가
      })
      console.log('Vision client created successfully')
    } catch (error) {
      console.error('Failed to create vision client:', error)
      throw new Error(`Failed to parse Google credentials: ${error}`)
    }
  }

  return visionClient
}
