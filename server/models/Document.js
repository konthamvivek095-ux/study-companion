const mongoose = require('mongoose')

const pageSchema = new mongoose.Schema(
  {
    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    text: {
      type: String,
      default: '',
    },
  },
  {
    _id: false,
  }
)

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    originalName: {
      type: String,
      required: true,
      maxlength: 255,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    pageCount: {
      type: Number,
      required: true,
    },
    pages: {
      type: [pageSchema],
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Document', documentSchema)