const fs = require('fs/promises')
const path = require('path')

const defaultData = {
  users: [],
  tasks: [],
  lastUserId: 0,
  lastTaskId: 0
}

const resolveDbPath = () => {
  return (
    process.env.JSON_DB_PATH ||
    path.join(__dirname, '..', 'data', 'db.json')
  )
}

const ensureStore = async () => {
  const dbPath = resolveDbPath()
  const dir = path.dirname(dbPath)
  await fs.mkdir(dir, { recursive: true })

  try {
    await fs.access(dbPath)
  } catch (error) {
    await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2))
  }
}

const loadData = async () => {
  const dbPath = resolveDbPath()
  const raw = await fs.readFile(dbPath, 'utf-8')
  return JSON.parse(raw)
}

const saveData = async (data) => {
  const dbPath = resolveDbPath()
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2))
}

const createUser = async ({ name, email, passwordHash }) => {
  const data = await loadData()
  const normalizedEmail = email.trim().toLowerCase()
  const newUser = {
    id: ++data.lastUserId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString()
  }
  data.users.push(newUser)
  await saveData(data)
  return newUser
}

const findUserByEmail = async (email) => {
  const data = await loadData()
  const normalizedEmail = email.trim().toLowerCase()
  return data.users.find((user) => user.email === normalizedEmail) || null
}

const listTasksByOwner = async (ownerId) => {
  const data = await loadData()
  return data.tasks
    .filter((task) => task.ownerId === ownerId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

const createTask = async ({ ownerId, title, details, status, priority, dueDate, tags }) => {
  const data = await loadData()
  const now = new Date().toISOString()
  const newTask = {
    id: ++data.lastTaskId,
    ownerId,
    title,
    details,
    status,
    priority,
    dueDate: dueDate || null,
    tags,
    createdAt: now,
    updatedAt: now
  }
  data.tasks.push(newTask)
  await saveData(data)
  return newTask
}

const findTaskById = async (taskId, ownerId) => {
  const data = await loadData()
  return data.tasks.find((task) => task.id === taskId && task.ownerId === ownerId) || null
}

const updateTask = async (taskId, ownerId, updates) => {
  const data = await loadData()
  const index = data.tasks.findIndex(
    (task) => task.id === taskId && task.ownerId === ownerId
  )
  if (index === -1) {
    return null
  }

  const current = data.tasks[index]
  const updated = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  data.tasks[index] = updated
  await saveData(data)
  return updated
}

const deleteTask = async (taskId, ownerId) => {
  const data = await loadData()
  const index = data.tasks.findIndex(
    (task) => task.id === taskId && task.ownerId === ownerId
  )
  if (index === -1) {
    return null
  }

  const [removed] = data.tasks.splice(index, 1)
  await saveData(data)
  return removed
}

module.exports = {
  ensureStore,
  createUser,
  findUserByEmail,
  listTasksByOwner,
  createTask,
  findTaskById,
  updateTask,
  deleteTask
}
