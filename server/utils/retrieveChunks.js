const stopWords = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in',
  'on', 'for', 'with', 'is', 'are', 'was', 'were',
  'be', 'been', 'what', 'which', 'who', 'how',
  'does', 'do', 'did', 'can', 'could', 'please',
  'this', 'that', 'these', 'those', 'my', 'your',
])

function tokenize(text) {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []

  return words
    .filter((word) => !stopWords.has(word))
    .map((word) => {
      // A simple way to match "project" with "projects".
      return word.length > 4 && word.endsWith('s')
        ? word.slice(0, -1)
        : word
    })
}

function retrieveChunks(chunks, question) {
  const limit = 6

  // Small documents fit within our passage limit.
  if (chunks.length <= limit) {
    return chunks
  }

  const questionWords = [...new Set(tokenize(question))]

  const ranked = chunks.map((chunk) => {
    const passageWords = new Set(tokenize(chunk.text))

    const score = questionWords.reduce(
      (total, word) => total + (passageWords.has(word) ? 1 : 0),
      0
    )

    return {
      ...chunk,
      score,
    }
  })

  return ranked
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex)
    .slice(0, limit)
}

module.exports = retrieveChunks