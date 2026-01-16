export type CaptureType = 'idea' | 'note' | 'task' | 'event' | 'link' | 'youtube' | 'voice'

export interface Capture {
  id: string
  type: CaptureType
  content: string
  context?: string
  url?: string
  scheduled_at?: string
  created_at: string
  synced: boolean
}

export interface CaptureCreate {
  type: CaptureType
  content: string
  context?: string
  url?: string
  scheduled_at?: string
}

export interface TaskItem {
  id: string
  title: string
  priority: number
  completed: boolean
  completed_at?: string
}

export interface DailySummary {
  date: string
  totalTasks: number
  completedTasks: number
  completedIds: string[]
  incompleteIds: string[]
}
