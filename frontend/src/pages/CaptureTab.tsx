import { useState, useEffect } from 'react'
import { CaptureType, Capture, CaptureCreate } from '../types'
import { createCapture, listCaptures } from '../api'

const CAPTURE_TYPES: { type: CaptureType; label: string; icon: string }[] = [
  { type: 'idea', label: 'Idea', icon: '💡' },
  { type: 'note', label: 'Note', icon: '📝' },
  { type: 'task', label: 'Task', icon: '✅' },
  { type: 'event', label: 'Event', icon: '📅' },
  { type: 'link', label: 'Link', icon: '🔗' },
  { type: 'youtube', label: 'YouTube', icon: '▶️' },
  { type: 'voice', label: 'Voice', icon: '🎤' },
]

export default function CaptureTab() {
  const [type, setType] = useState<CaptureType>('idea')
  const [content, setContent] = useState('')
  const [context, setContext] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [recentCaptures, setRecentCaptures] = useState<Capture[]>([])

  useEffect(() => {
    loadRecent()
  }, [])

  const loadRecent = async () => {
    try {
      const captures = await listCaptures()
      setRecentCaptures(captures.slice(0, 5))
    } catch (err) {
      console.error('Failed to load captures:', err)
    }
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    try {
      const data: CaptureCreate = {
        type,
        content: content.trim(),
        context: context.trim() || undefined,
        url: url.trim() || undefined,
      }

      await createCapture(data)
      showToast('Captured!')
      setContent('')
      setContext('')
      setUrl('')
      loadRecent()
    } catch (err) {
      console.error('Failed to capture:', err)
      showToast('Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const needsUrl = type === 'link' || type === 'youtube'

  return (
    <div>
      <form className="capture-form" onSubmit={handleSubmit}>
        <div className="type-selector">
          {CAPTURE_TYPES.map(({ type: t, label, icon }) => (
            <button
              key={t}
              type="button"
              className={`type-btn ${type === t ? 'active' : ''}`}
              onClick={() => setType(t)}
            >
              <span className="icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="input-group">
          <label>What are you capturing?</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Enter your ${type}...`}
            autoFocus
          />
        </div>

        {needsUrl && (
          <div className="input-group">
            <label>URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        <div className="input-group">
          <label>Why? (optional context)</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Why did you save this?"
          />
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={!content.trim() || submitting}
        >
          {submitting ? 'Saving...' : 'Capture'}
        </button>
      </form>

      {recentCaptures.length > 0 && (
        <div className="recent-section">
          <h3>Recent Captures</h3>
          {recentCaptures.map((capture) => (
            <div key={capture.id} className="capture-item">
              <div className="capture-type">{capture.type}</div>
              <div className="capture-content">{capture.content}</div>
              {capture.context && (
                <div className="capture-context">{capture.context}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
