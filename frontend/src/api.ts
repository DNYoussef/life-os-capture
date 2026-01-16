import { Capture, CaptureCreate, TaskItem, DailySummary } from './types'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// Capture endpoints
export const createCapture = (data: CaptureCreate): Promise<Capture> =>
  fetchJSON('/api/capture', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const listCaptures = (): Promise<Capture[]> =>
  fetchJSON('/api/capture')

export const deleteCapture = (id: string): Promise<void> =>
  fetchJSON(`/api/capture/${id}`, { method: 'DELETE' })

// Task endpoints
export const getTodayTasks = (): Promise<TaskItem[]> =>
  fetchJSON('/api/tasks/today')

export const completeTask = (id: string): Promise<TaskItem> =>
  fetchJSON(`/api/tasks/${id}/complete`, { method: 'POST' })

export const uncompleteTask = (id: string): Promise<TaskItem> =>
  fetchJSON(`/api/tasks/${id}/uncomplete`, { method: 'POST' })

// Sync endpoints
export const syncDailySummary = (summary: DailySummary): Promise<{ success: boolean; message: string }> =>
  fetchJSON('/api/sync/daily-summary', {
    method: 'POST',
    body: JSON.stringify(summary),
  })
