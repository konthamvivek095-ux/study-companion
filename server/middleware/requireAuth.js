const User = require('../models/User')

async function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: 'Please log in to continue.',
    })
  }

  try {
    const userExists = await User.exists({
      _id: req.session.userId,
    })

    if (!userExists) {
      return res.status(401).json({
        message: 'Your account is unavailable. Please log in again.',
      })
    }

    req.authUserId = req.session.userId
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = requireAuth