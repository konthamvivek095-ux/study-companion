const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const { MongoStore } = require('connect-mongo')
const path = require('node:path')
const fs = require('node:fs')

const User = require('./models/User')
const Chunk = require('./models/Chunk')
const Quiz = require('./models/Quiz')
const QuizAttempt = require('./models/QuizAttempt')

const authRoutes = require('./routes/auth')
const documentRoutes = require('./routes/documents')
const indexingRoutes = require('./routes/indexing')
const questionRoutes = require('./routes/questions')
const quizRoutes = require('./routes/quizzes')

const app = express()

const PORT = Number(process.env.PORT) || 5001
const isProduction = process.env.NODE_ENV === 'production'
const clientDirectory = path.resolve(__dirname, '../client/dist')
const clientIndex = path.join(clientDirectory, 'index.html')

// For hosting behind a reverse proxy, such as Render.
if (isProduction) {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')
app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1

  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    message: 'Study Companion backend is running',
    database: connected ? 'connected' : 'disconnected',
  })
})

async function startServer() {
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    console.error('Missing MONGODB_URI or SESSION_SECRET.')
    process.exit(1)
  }

  if (isProduction && !fs.existsSync(clientIndex)) {
    console.error(
      'React build is missing. Run npm run build in the client folder.'
    )
    process.exit(1)
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'study_companion',
      serverSelectionTimeoutMS: 10000,
    })

    await User.init()
    await Chunk.init()
    await Quiz.init()
    await QuizAttempt.init()

    const sessionStore = MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: 'study_companion',
      collectionName: 'sessions',
    })

    sessionStore.on('error', (error) => {
      console.error(`Session store error: ${error.name}`)
    })

    app.use(
      session({
        name: 'study.sid',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProduction,
          maxAge: 24 * 60 * 60 * 1000,
        },
      })
    )

    app.use('/api/auth', authRoutes)
    app.use('/api/documents', documentRoutes)
    app.use('/api/documents', indexingRoutes)
    app.use('/api/questions', questionRoutes)
    app.use('/api/quizzes', quizRoutes)

    // Unknown API routes return JSON.
    app.use('/api', (req, res) => {
      res.status(404).json({
        message: 'API route not found.',
      })
    })

    if (isProduction) {
      app.use(express.static(clientDirectory))

      // Serve React for frontend routes.
      app.get('/{*splat}', (req, res, next) => {
        res.sendFile(clientIndex, (error) => {
          if (error) next(error)
        })
      })
    }

    app.use((error, req, res, next) => {
      console.error(`Request failed: ${error.name}`)

      if (res.headersSent) {
        return next(error)
      }

      const status =
        error.type === 'entity.parse.failed'
          ? 400
          : error.type === 'entity.too.large'
            ? 413
            : 500

      res.status(status).json({
        message:
          status === 400
            ? 'Invalid JSON request.'
            : status === 413
              ? 'Request is too large.'
              : 'Something went wrong. Please try again.',
      })
    })

    app.listen(PORT, '0.0.0.0', () => {
      console.log('MongoDB connected successfully')
      console.log(`Server listening on port ${PORT}`)
    })
  } catch (error) {
    console.error(`Server startup failed: ${error.name}`)
    process.exit(1)
  }
}

startServer()