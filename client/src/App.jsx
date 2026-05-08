import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const statusLabels = {
  backlog: 'Backlog',
  'in-progress': 'In Progress',
  blocked: 'Blocked',
  done: 'Done'
}

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
}

const emptyDraft = {
  title: '',
  details: '',
  status: 'backlog',
  priority: 'medium',
  dueDate: '',
  tags: ''
}

const formatDate = (value) => {
  if (!value) return 'No due date'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'No due date'
  return parsed.toLocaleDateString()
}

const badgeClass = (status) => `badge badge-${status}`

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [token, setToken] = useState(() => localStorage.getItem('tm_token'))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('tm_user')
    return stored ? JSON.parse(stored) : null
  })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [savingTask, setSavingTask] = useState(false)
  const [taskError, setTaskError] = useState('')
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' })

  useEffect(() => {
    if (token) {
      fetchTasks()
    }
  }, [token])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false
      }
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false
      }
      return true
    })
  }, [tasks, filters])

  const groupedTasks = useMemo(() => {
    return Object.keys(statusLabels).reduce((acc, statusKey) => {
      acc[statusKey] = filteredTasks.filter((task) => task.status === statusKey)
      return acc
    }, {})
  }, [filteredTasks])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const formData = new FormData(event.target)
    const payload = Object.fromEntries(formData)

    try {
      const response = await fetch(`${API_URL}/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to authenticate.')
      }

      localStorage.setItem('tm_token', data.token)
      localStorage.setItem('tm_user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchTasks = async () => {
    setLoadingTasks(true)
    setTaskError('')

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load tasks.')
      }

      setTasks(data)
    } catch (error) {
      setTaskError(error.message)
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleDraftChange = (event) => {
    const { name, value } = event.target
    setDraft((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitTask = async (event) => {
    event.preventDefault()
    if (!draft.title.trim()) {
      setTaskError('Please add a task title.')
      return
    }

    setSavingTask(true)
    setTaskError('')

    const payload = {
      title: draft.title.trim(),
      details: draft.details,
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || null,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    }

    try {
      const url = editingId
        ? `${API_URL}/api/tasks/${editingId}`
        : `${API_URL}/api/tasks`
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save task.')
      }

      if (editingId) {
        setTasks((prev) => prev.map((task) => (task.id === editingId ? data : task)))
      } else {
        setTasks((prev) => [data, ...prev])
      }

      setDraft(emptyDraft)
      setEditingId(null)
    } catch (error) {
      setTaskError(error.message)
    } finally {
      setSavingTask(false)
    }
  }

  const handleEdit = (task) => {
    setDraft({
      title: task.title,
      details: task.details,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      tags: task.tags.join(', ')
    })
    setEditingId(task.id)
  }

  const handleDelete = async (taskId) => {
    setTaskError('')
    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete task.')
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    } catch (error) {
      setTaskError(error.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('tm_token')
    localStorage.removeItem('tm_user')
    setToken(null)
    setUser(null)
    setTasks([])
    setDraft(emptyDraft)
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-header">
            <p className="eyebrow">Task Atlas</p>
            <h1>Own the day with focused task rituals.</h1>
            <p className="subhead">
              Sign in to manage priorities, track momentum, and keep delivery
              moving.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <label>
                Full name
                <input name="name" type="text" placeholder="Name" required />
              </label>
            )}

            <label>
              Email
              <input name="email" type="email" placeholder="name@email.com" required />
            </label>

            <label>
              Password
              <input name="password" type="password" placeholder="Minimum 6 characters" required />
            </label>

            {authError && <p className="form-error">{authError}</p>}

            <button className="primary" type="submit" disabled={authLoading}>
              {authLoading ? 'Working...' : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            <button
              type="button"
              className="ghost"
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            >
              {authMode === 'login'
                ? 'Need an account? Create one.'
                : 'Already have an account? Sign in.'}
            </button>
          </form>
        </div>
        <div className="auth-aside">
          <div className="glass-card">
            <p className="eyebrow">Momentum board</p>
            <h2>Plan with clarity.</h2>
            <ul>
              <li>Capture every idea in one calm backlog.</li>
              <li>Surface urgent work before it blocks the team.</li>
              <li>Move tasks into Done with a single tap.</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Task Atlas</p>
          <h1>Welcome back{user?.name ? `, ${user.name}` : ''}.</h1>
          <p className="subhead">Stay on top of deliverables with a focused daily map.</p>
        </div>
        <div className="topbar-actions">
          <div className="filters">
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
            >
              <option value="all">All status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, priority: event.target.value }))
              }
            >
              <option value="all">All priority</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button className="ghost" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content-grid">
        <section className="composer">
          <h2>{editingId ? 'Update task' : 'Create a new task'}</h2>
          <p className="muted">Outline the next meaningful action and set the cadence.</p>

          <form className="task-form" onSubmit={handleSubmitTask}>
            <label>
              Task title
              <input name="title" value={draft.title} onChange={handleDraftChange} />
            </label>

            <label>
              Details
              <textarea
                name="details"
                rows="4"
                value={draft.details}
                onChange={handleDraftChange}
              />
            </label>

            <div className="form-row">
              <label>
                Status
                <select name="status" value={draft.status} onChange={handleDraftChange}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select name="priority" value={draft.priority} onChange={handleDraftChange}>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Due date
                <input
                  name="dueDate"
                  type="date"
                  value={draft.dueDate}
                  onChange={handleDraftChange}
                />
              </label>
              <label>
                Tags
                <input
                  name="tags"
                  value={draft.tags}
                  onChange={handleDraftChange}
                  placeholder="design, qa, launch"
                />
              </label>
            </div>

            {taskError && <p className="form-error">{taskError}</p>}

            <button className="primary" type="submit" disabled={savingTask}>
              {savingTask ? 'Saving...' : editingId ? 'Update task' : 'Create task'}
            </button>
            {editingId && (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setEditingId(null)
                  setDraft(emptyDraft)
                }}
              >
                Cancel edit
              </button>
            )}
          </form>
        </section>

        <section className="board">
          <div className="board-header">
            <h2>Task flow</h2>
            <p className="muted">{loadingTasks ? 'Loading tasks...' : `${filteredTasks.length} active tasks`}</p>
          </div>

          {taskError && <p className="form-error">{taskError}</p>}

          <div className="columns">
            {Object.keys(statusLabels).map((statusKey) => (
              <div className="column" key={statusKey}>
                <div className="column-title">
                  <span>{statusLabels[statusKey]}</span>
                  <span className="count">{groupedTasks[statusKey]?.length || 0}</span>
                </div>
                <div className="card-stack">
                  {groupedTasks[statusKey]?.map((task) => (
                    <article className="task-card" key={task.id}>
                      <div className="card-top">
                        <span className={badgeClass(task.status)}>{statusLabels[task.status]}</span>
                        <span className={`pill pill-${task.priority}`}>{priorityLabels[task.priority]}</span>
                      </div>
                      <h3>{task.title}</h3>
                      <p>{task.details || 'No details yet. Add context to stay on track.'}</p>
                      <div className="card-meta">
                        <span>{formatDate(task.dueDate)}</span>
                        <span>{task.tags.length ? task.tags.join(', ') : 'No tags'}</span>
                      </div>
                      <div className="card-actions">
                        <button className="ghost" type="button" onClick={() => handleEdit(task)}>
                          Edit
                        </button>
                        <button className="ghost danger" type="button" onClick={() => handleDelete(task.id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
