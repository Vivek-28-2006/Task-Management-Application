const express = require('express')
const {
  listTasksByOwner,
  createTask,
  findTaskById,
  updateTask,
  deleteTask
} = require('../jsonStore')

const router = express.Router()

router.get('/', async (req, res) => {
  const tasks = await listTasksByOwner(req.user.id)
  return res.json(tasks)
})

router.post('/', async (req, res) => {
  const { title, details, status, priority, dueDate, tags } = req.body || {}

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required.' })
  }

  const safeTags = Array.isArray(tags) ? tags : []
  const task = await createTask({
    ownerId: req.user.id,
    title: title.trim(),
    details: details || '',
    status: status || 'backlog',
    priority: priority || 'medium',
    dueDate: dueDate || null,
    tags: safeTags
  })

  return res.status(201).json(task)
})

router.get('/:id', async (req, res) => {
  const taskId = Number(req.params.id)
  const task = await findTaskById(taskId, req.user.id)
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' })
  }

  return res.json(task)
})

router.put('/:id', async (req, res) => {
  const updates = req.body || {}

  if (updates.title && !updates.title.trim()) {
    return res.status(400).json({ message: 'Title cannot be empty.' })
  }

  const taskId = Number(req.params.id)
  const current = await findTaskById(taskId, req.user.id)
  if (!current) {
    return res.status(404).json({ message: 'Task not found.' })
  }

  const updated = await updateTask(taskId, req.user.id, {
    title: updates.title ? updates.title.trim() : current.title,
    details: updates.details ?? current.details,
    status: updates.status ?? current.status,
    priority: updates.priority ?? current.priority,
    dueDate: updates.dueDate ?? current.dueDate,
    tags: Array.isArray(updates.tags) ? updates.tags : current.tags
  })

  return res.json(updated)
})

router.delete('/:id', async (req, res) => {
  const taskId = Number(req.params.id)
  const removed = await deleteTask(taskId, req.user.id)
  if (!removed) {
    return res.status(404).json({ message: 'Task not found.' })
  }

  return res.json({ message: 'Task deleted.' })
})

module.exports = router
