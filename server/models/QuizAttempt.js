const mongoose = require('mongoose')

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    concept: {
      type: String,
      required: true,
      maxlength: 150,
    },

    selectedAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      validate: {
        validator: Number.isInteger,
        message: 'The selected answer must be an integer.',
      },
    },

    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      validate: {
        validator: Number.isInteger,
        message: 'The correct answer must be an integer.',
      },
    },

    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
)

const quizAttemptSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },

    score: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },

    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    answers: {
      type: [answerSchema],
      required: true,
      validate: {
        validator: (answers) =>
          answers.length >= 1 && answers.length <= 5,
        message: 'An attempt must contain between one and five answers.',
      },
    },
  },
  { timestamps: true }
)

quizAttemptSchema.index({ owner: 1, createdAt: -1 })

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema)