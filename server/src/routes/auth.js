const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { createUser, findUserByEmail } = require('../jsonStore')

const router = express.Router()

const createToken = (userId) => {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' })
  }

  const trimmedName = name.trim()
  const trimmedEmail = email.trim()

  if (!trimmedName || !trimmedEmail) {
    return res.status(400).json({ message: 'Name and email are required.' })
  }

  const existing = await findUserByEmail(trimmedEmail)
  if (existing) {
    return res.status(409).json({ message: 'Email already in use.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await createUser({ name: trimmedName, email: trimmedEmail, passwordHash })
  const token = createToken(user.id)

  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const user = await findUserByEmail(email)
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const matches = await bcrypt.compare(password, user.passwordHash)
  if (!matches) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const token = createToken(user.id)
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  })
})

module.exports = router
