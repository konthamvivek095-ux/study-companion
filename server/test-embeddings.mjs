import { GoogleGenAI } from '@google/genai'

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in server/.env.')
  process.exit(1)
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

try {
  const response = await ai.models.embedContent({
    model:
      process.env.GEMINI_EMBEDDING_MODEL ||
      'gemini-embedding-001',

    contents:
      'Overfitting happens when a model learns training data too closely and performs poorly on new data.',

    config: {
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: 768,
    },
  })

  const vector = response.embeddings?.[0]?.values

  if (
    !Array.isArray(vector) ||
    vector.length !== 768 ||
    !vector.every(Number.isFinite)
  ) {
    throw new Error('Unexpected embedding response')
  }

  console.log('Embedding created successfully.')
  console.log('Dimensions:', vector.length)
  console.log('First five values:', vector.slice(0, 5))
} catch (error) {
  console.error(
    'Embedding test failed:',
    error.status || error.name
  )

  process.exitCode = 1
}