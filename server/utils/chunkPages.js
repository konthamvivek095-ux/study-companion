function chunkPages(pages) {
  const chunks = []
  const chunkSize = 1200
  const overlap = 200

  for (const page of pages) {
    const text = page.text.trim()

    if (!text) continue

    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      const passage = text.slice(start, end).trim()

      if (passage) {
        chunks.push({
          chunkIndex: chunks.length,
          pageNumber: page.pageNumber,
          text: passage,
        })
      }

      if (end === text.length) break

      start = end - overlap
    }
  }

  return chunks
}

module.exports = chunkPages