const mongoose = require('mongoose')

const citationSchema = new mongoose.Schema(
  {
    sourceId: {
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
      maxlength: 2000,
    },
  },
  { _id: false }
)

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },

  options: {
    type: [String],
    required: true,
    validate: {
      validator(options) {
        return (
          options.length === 4 &&
          options.every(
            (option) =>
              typeof option === 'string' &&
              option.trim().length > 0 &&
              option.length <= 500
          ) &&
          new Set(
            options.map((option) => option.trim().toLowerCase())
          ).size === 4
        )
      },
      message: 'Each question needs four distinct, nonempty options.',
    },
  },

  correctAnswerIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
    validate: {
      validator: Number.isInteger,
      message: 'The answer index must be an integer.',
    },
    select: false,
  },

  explanation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
    select: false,
  },

  concept: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },

  citations: {
    type: [citationSchema],
    required: true,
    validate: {
      validator: (citations) => citations.length > 0,
      message: 'Each question needs a supporting passage.',
    },
    select: false,
  },
})

const quizSchema = new mongoose.Schema(
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

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (questions) =>
          questions.length >= 1 && questions.length <= 5,
        message: 'A quiz must contain between one and five questions.',
      },
    },
  },
  { timestamps: true }
)

quizSchema.index({ owner: 1, createdAt: -1 })

module.exports = mongoose.model('Quiz', quizSchema)