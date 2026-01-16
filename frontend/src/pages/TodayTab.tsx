import { useState, useEffect } from 'react'
import { TaskItem, DailySummary } from '../types'
import { getTodayTasks, completeTask, uncompleteTask, syncDailySummary } from '../api'

export default function TodayTab() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await getTodayTasks()
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const toggleTask = async (task: TaskItem) => {
    try {
      if (task.completed) {
        const updated = await uncompleteTask(task.id)
        setTasks(tasks.map(t => t.id === task.id ? updated : t))
      } else {
        const updated = await completeTask(task.id)
        setTasks(tasks.map(t => t.id === task.id ? updated : t))
      }
    } catch (err) {
      console.error('Failed to update task:', err)
      showToast('Failed to update')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const completed = tasks.filter(t => t.completed)
      const incomplete = tasks.filter(t => !t.completed)

      const summary: DailySummary = {
        date: new Date().toISOString().split('T')[0],
        totalTasks: tasks.length,
        completedTasks: completed.length,
        completedIds: completed.map(t => t.id),
        incompleteIds: incomplete.map(t => t.id),
      }

      const result = await syncDailySummary(summary)
      if (result.success) {
        showToast('Synced to local!')
      } else {
        showToast(result.message || 'Sync pending')
      }
    } catch (err) {
      console.error('Failed to sync:', err)
      showToast('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const completedCount = tasks.filter(t => t.completed).length
  const completionRate = tasks.length > 0
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  if (loading) {
    return <div className="loading">Loading tasks...</div>
  }

  return (
    <div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{completedCount}/{tasks.length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Progress</div>
        </div>
      </div>

      <div className="tasks-header">
        <h2>Today's Tasks</h2>
        <button
          className="sync-btn"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync to Local'}
        </button>
      </div>

      <div className="task-list">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`task-item ${task.completed ? 'completed' : ''}`}
            onClick={() => toggleTask(task)}
          >
            <div className="task-checkbox">
              {task.completed && '✓'}
            </div>
            <span className="task-title">{task.title}</span>
            {task.priority === 1 && (
              <span className="priority-badge priority-1">P1</span>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="loading">No tasks for today</div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
