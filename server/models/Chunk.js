const mongoose = require('mongoose')

const chunkSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    text: {
      type: String,
      required: true,
    },

    embeddingModel: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
      default: undefined,
      select: false,
      validate: {
        validator: (values) =>
          Array.isArray(values) &&
          values.length === 768 &&
          values.every(Number.isFinite),

        message: 'Embedding must contain 768 valid numbers.',
      },
    },
  },
  {
    timestamps: true,
  }
)

chunkSchema.index(
  { document: 1, chunkIndex: 1, embeddingModel: 1 },
  { unique: true }
)

chunkSchema.index({
  owner: 1,
  document: 1,
  embeddingModel: 1,
})

module.exports = mongoose.model('Chunk', chunkSchema)