const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { ensureStore } = require('./jsonStore')
const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const { requireAuth } = require('./middleware/auth')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(express.json({ limit: '1mb' }))
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: false
  })
)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/tasks', requireAuth, taskRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Server error.' })
})

ensureStore()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize JSON store', error)
    process.exit(1)
  })
