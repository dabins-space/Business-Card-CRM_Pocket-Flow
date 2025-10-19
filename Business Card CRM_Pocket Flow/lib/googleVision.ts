import { ImageAnnotatorClient } from '@google-cloud/vision'

let visionClient: ImageAnnotatorClient | null = null

export const getVisionClient = (): ImageAnnotatorClient => {
  if (!visionClient) {
    const credentialsB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64
    
    if (!credentialsB64) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_B64 environment variable is required')
    }

    try {
      const credentials = JSON.parse(Buffer.from(credentialsB64, 'base64').toString())
      
      visionClient = new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id
      })
    } catch (error) {
      throw new Error(`Failed to parse Google credentials: ${error}`)
    }
  }

  return visionClient
}
