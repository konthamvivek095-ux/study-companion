const Chunk = require('../models/Chunk')
const createEmbeddings = require('./createEmbeddings')

function cosineSimilarity(a, b) {
  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let index = 0; index < a.length; index++) {
    dotProduct += a[index] * b[index]
    magnitudeA += a[index] * a[index]
    magnitudeB += b[index] * b[index]
  }

  const denominator =
    Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)

  return denominator === 0 ? 0 : dotProduct / denominator
}

async function semanticRetrieveChunks(
  passages,
  question,
  { documentId, owner }
) {
  const embeddingModel =
    process.env.GEMINI_EMBEDDING_MODEL ||
    'gemini-embedding-001'

  const savedChunks = await Chunk.find({
    owner,
    document: documentId,
    embeddingModel,
  })
    .select('+embedding')
    .lean()

  const savedByIndex = new Map(
    savedChunks.map((chunk) => [
      chunk.chunkIndex,
      chunk,
    ])
  )

  const readyChunks = []

  for (const passage of passages) {
    const saved = savedByIndex.get(passage.chunkIndex)

    const validEmbedding =
      Array.isArray(saved?.embedding) &&
      saved.embedding.length === 768 &&
      saved.embedding.every(Number.isFinite) &&
      saved.embedding.some((value) => value !== 0)

    if (
      !saved ||
      saved.text !== passage.text ||
      saved.pageNumber !== passage.pageNumber ||
      !validEmbedding
    ) {
      const error = new Error(
        'Please index this document before asking questions.'
      )

      error.statusCode = 409
      throw error
    }

    readyChunks.push(saved)
  }

  if (readyChunks.length === 0) {
    return []
  }

  const [questionEmbedding] = await createEmbeddings(
    [question],
    'RETRIEVAL_QUERY'
  )

  return readyChunks
    .map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      text: chunk.text,
      score: cosineSimilarity(
        questionEmbedding,
        chunk.embedding
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.chunkIndex - b.chunkIndex
    )
    .slice(0, 6)
}

module.exports = semanticRetrieveChunks