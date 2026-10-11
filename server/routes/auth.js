const express = require('express')
const bcrypt = require('bcryptjs')
const { rateLimit } = require('express-rate-limit')
const User = require('../models/User')

const router = express.Router()
const dummyPasswordHash = bcrypt.hashSync(
  require('node:crypto').randomBytes(32).toString('hex'),
  12
)

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many signup attempts. Please try again later.',
  },
})

router.post('/register', signupLimiter, async (req, res) => {
  const { name, email, password } = req.body || {}

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      message: 'Name, email, and password are required.',
    })
  }

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  if (cleanName.length < 2 || cleanName.length > 80) {
    return res.status(400).json({
      message: 'Name must contain between 2 and 80 characters.',
    })
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (cleanEmail.length > 254 || !emailPattern.test(cleanEmail)) {
    return res.status(400).json({
      message: 'Please enter a valid email address.',
    })
  }

  if (
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      message: 'Password must be at least 12 characters and at most 72 bytes.',
    })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
    })

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      })
    }

    console.error(`Registration failed: ${error.name}`)

    return res.status(500).json({
      message: 'Unable to create your account. Please try again.',
    })
  }
})
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again later.',
  },
})

router.post('/login', loginLimiter, async (req, res, next) => {
  const { email, password } = req.body || {}

  if (
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      message: 'Email and password are required.',
    })
  }

  const cleanEmail = email.trim().toLowerCase()

  if (
    !cleanEmail ||
    cleanEmail.length > 254 ||
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(401).json({
      message: 'Invalid email or password.',
    })
  }

  try {
    const user = await User.findOne({
      email: cleanEmail,
    }).select('+passwordHash')

    // Compare against a dummy hash when no user exists.
    // This avoids immediately returning for unknown emails.
    const hash = user ? user.passwordHash : dummyPasswordHash
    const passwordMatches = await bcrypt.compare(password, hash)

    if (!user || !passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      })
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) return reject(error)
        resolve()
      })
    })

    req.session.userId = user._id.toString()

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) return reject(error)
        resolve()
      })
    })

    return res.json({
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})
router.get('/me', async (req, res, next) => {
  res.set('Cache-Control', 'no-store')

  if (!req.session.userId) {
    return res.status(401).json({
      message: 'You are not logged in.',
    })
  }

  try {
    const user = await User.findById(req.session.userId)
      .select('_id name email')

    if (!user) {
      return res.status(401).json({
        message: 'Your account is unavailable. Please log in again.',
      })
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', (req, res, next) => {
  res.set('Cache-Control', 'no-store')

  req.session.destroy((error) => {
    if (error) {
      return next(error)
    }

    res.clearCookie('study.sid', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return res.json({
      message: 'Logged out successfully.',
    })
  })
})
module.exports = router