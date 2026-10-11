const express = require('express')
const multer = require('multer')
const { PDFParse } = require('pdf-parse')
const { rateLimit } = require('express-rate-limit')
const Document = require('../models/Document')
const requireAuth = require('../middleware/requireAuth')
const mongoose = require('mongoose')
const chunkPages = require('../utils/chunkPages')

const router = express.Router()

router.use(requireAuth)

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.authUserId,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many uploads. Please try again later.',
  },
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
  },
})

function receivePdf(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE'

      return res.status(tooLarge ? 413 : 400).json({
        message: tooLarge
          ? 'Please upload a PDF smaller than 5 MB.'
          : 'Upload exactly one PDF using the file field.',
      })
    }

    next()
  })
}

router.post('/', uploadLimiter, receivePdf, async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Please select a PDF.',
    })
  }

  const signature = req.file.buffer.subarray(0, 5).toString('ascii')

  if (signature !== '%PDF-') {
    return res.status(400).json({
      message: 'The uploaded file must be a PDF.',
    })
  }

  let parser
  let pages
  let pageCount

  try {
    parser = new PDFParse({
      data: req.file.buffer,
    })

    const info = await parser.getInfo()

    if (info.total > 100) {
      return res.status(413).json({
        message: 'Please upload a PDF with at most 100 pages.',
      })
    }

    const result = await parser.getText()

    pageCount = info.total
    pages = result.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim(),
    }))

    const hasText = pages.some((page) => page.text.length > 0)

    if (!hasText) {
      return res.status(422).json({
        message:
          'No readable text was found. Please use a text-based PDF; scanned PDFs need OCR.',
      })
    }

    const textSize = pages.reduce(
      (total, page) => total + Buffer.byteLength(page.text, 'utf8'),
      0
    )

    if (textSize > 2 * 1024 * 1024) {
      return res.status(413).json({
        message: 'This PDF contains too much text. Please use a smaller document.',
      })
    }
  } catch {
    return res.status(422).json({
      message:
        'Unable to read this PDF. Please use a valid PDF without password protection.',
    })
  } finally {
    if (parser) {
      try {
        await parser.destroy()
      } catch (error) {
        console.error(`PDF cleanup failed: ${error.name}`)
      }
    }
  }

  try {
    const originalName = req.file.originalname
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      .slice(0, 255) || 'document.pdf'

    const title = originalName
      .replace(/\.pdf$/i, '')
      .trim()
      .slice(0, 200) || 'Untitled document'

    const document = await Document.create({
      owner: req.authUserId,
      title,
      originalName,
      fileSize: req.file.size,
      pageCount,
      pages,
    })

    return res.status(201).json({
      message: 'PDF uploaded and processed successfully.',
      document: {
        id: document._id,
        title: document.title,
        originalName: document.originalName,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        createdAt: document.createdAt,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const documents = await Document.find({
      owner: req.authUserId,
    })
      .select('_id title originalName fileSize pageCount createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    return res.json({
      documents: documents.map((document) => ({
        id: document._id,
        title: document.title,
        originalName: document.originalName,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        createdAt: document.createdAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})
router.get('/:documentId/chunks', async (req, res, next) => {
  const { documentId } = req.params

  if (!mongoose.isObjectIdOrHexString(documentId)) {
    return res.status(400).json({
      message: 'Invalid document ID.',
    })
  }

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

    const chunks = chunkPages(document.pages)

    return res.json({
      document: {
        id: document._id,
        title: document.title,
        pageCount: document.pageCount,
      },
      chunkCount: chunks.length,
      chunks,
    })
  } catch (error) {
    next(error)
  }
})
module.exports = router
