const express = require('express')
const mongoose = require('mongoose')
const { rateLimit } = require('express-rate-limit')
const Document = require('../models/Document')
const Chunk = require('../models/Chunk')
const requireAuth = require('../middleware/requireAuth')
const chunkPages = require('../utils/chunkPages')
const createEmbeddings = require('../utils/createEmbeddings')

const router = express.Router()
const activeJobs = new Set()

router.use(requireAuth)

const indexingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.authUserId,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many indexing requests. Please try again later.',
  },
})

router.post(
  '/:documentId/index',
  indexingLimiter,
  async (req, res, next) => {
    res.set('Cache-Control', 'no-store')

    const { documentId } = req.params

    if (!mongoose.isObjectIdOrHexString(documentId)) {
      return res.status(400).json({
        message: 'Invalid document ID.',
      })
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: 'The AI service is not configured.',
      })
    }

    const embeddingModel =
      process.env.GEMINI_EMBEDDING_MODEL ||
      'gemini-embedding-001'

    const jobKey =
      `${req.authUserId}:${documentId}:${embeddingModel}`

    if (activeJobs.has(jobKey)) {
      return res.status(409).json({
        message: 'This document is already being indexed.',
      })
    }

    activeJobs.add(jobKey)

    try {
      const document = await Document.findOne({
        _id: documentId,
        owner: req.authUserId,
      })
        .select('+pages')
        .lean()

      if (!document) {
        return res.status(404).json({
          message: 'Document not found.',
        })
      }

      const passages = chunkPages(document.pages)

      if (passages.length === 0) {
        return res.status(422).json({
          message: 'This document has no readable passages.',
        })
      }

      if (passages.length > 200) {
        return res.status(413).json({
          message:
            'For this version, please use a document with at most 200 passages.',
        })
      }

      const existingChunks = await Chunk.find({
        owner: req.authUserId,
        document: documentId,
        embeddingModel,
      })
        .select('chunkIndex pageNumber text')
        .lean()

      const existingByIndex = new Map(
        existingChunks.map((chunk) => [
          chunk.chunkIndex,
          chunk,
        ])
      )

      const missingPassages = passages.filter((passage) => {
        const existing = existingByIndex.get(passage.chunkIndex)

        return (
          !existing ||
          existing.text !== passage.text ||
          existing.pageNumber !== passage.pageNumber
        )
      })

      const batchSize = 10
      let newlyIndexed = 0

      for (
        let start = 0;
        start < missingPassages.length;
        start += batchSize
      ) {
        const batch = missingPassages.slice(
          start,
          start + batchSize
        )

        const embeddings = await createEmbeddings(
          batch.map((passage) => passage.text)
        )

        await Chunk.bulkWrite(
          batch.map((passage, index) => ({
            updateOne: {
              filter: {
                document: document._id,
                chunkIndex: passage.chunkIndex,
                embeddingModel,
              },
              update: {
                $set: {
                  owner: document.owner,
                  document: document._id,
                  chunkIndex: passage.chunkIndex,
                  pageNumber: passage.pageNumber,
                  text: passage.text,
                  embeddingModel,
                  embedding: embeddings[index],
                },
              },
              upsert: true,
            },
          }))
        )

        newlyIndexed += batch.length
      }

      return res.json({
        message: 'Document indexed successfully.',
        documentId: document._id,
        totalChunks: passages.length,
        newlyIndexed,
        reusedChunks: passages.length - missingPassages.length,
        embeddingModel,
      })
    } catch (error) {
      console.error(
        'Indexing failed:',
        error.status || error.name
      )

      if (error.status === 429) {
        return res.status(429).json({
          message:
            'Gemini quota or rate limit reached. Saved passages will be reused when you retry.',
        })
      }

      if (error.status >= 400) {
        return res.status(502).json({
          message:
            'Embedding request failed. Check your Gemini model access and API configuration.',
        })
      }

      next(error)
    } finally {
      activeJobs.delete(jobKey)
    }
  }
)

module.exports = router