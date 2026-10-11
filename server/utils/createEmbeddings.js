const { GoogleGenAI } = require('@google/genai')

async function createEmbeddings(
  texts,
  taskType = 'RETRIEVAL_DOCUMENT'
) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  })

  const response = await ai.models.embedContent({
    model:
      process.env.GEMINI_EMBEDDING_MODEL ||
      'gemini-embedding-001',

    contents: texts,

    config: {
      taskType,
      outputDimensionality: 768,
    },
  })

  if (response.embeddings?.length !== texts.length) {
    throw new Error('Unexpected number of embeddings')
  }

  return response.embeddings.map((item) => {
    const vector = item.values

    if (
      !Array.isArray(vector) ||
      vector.length !== 768 ||
      !vector.every(Number.isFinite)
    ) {
      throw new Error('Invalid embedding')
    }

    const magnitude = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0)
    )

    if (magnitude === 0) {
      throw new Error('Empty embedding vector')
    }

    return vector.map((value) => value / magnitude)
  })
}

module.exports = createEmbeddings