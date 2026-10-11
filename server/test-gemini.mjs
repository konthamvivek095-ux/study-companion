import { GoogleGenAI } from '@google/genai'

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in server/.env.')
  process.exit(1)
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

try {
  await ai.models.list()

  console.log('Gemini authentication successful.')
} catch (error) {
  console.error(
    'Gemini authentication check failed:',
    error.status || error.name
  )

  if (error.status === 400) {
    console.error('Check that your Gemini API key is valid.')
  } else if (error.status === 403) {
    console.error('Check the API key restrictions and project permissions.')
  } else if (error.status === 429) {
    console.error('The request was rate limited. Please try again later.')
  }

  process.exitCode = 1
}