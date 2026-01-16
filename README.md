# Life OS Capture

Minimal PWA for frictionless phone capture and daily task management.

**Building Block #1: Dropbox** - Part of the AI Exoskeleton ecosystem.

## Features

### Capture Tab (Input)
- Universal capture: ideas, notes, tasks, events, links, YouTube, voice
- Context field: "Why did you save this?"
- Offline support with service worker
- Auto-sync when online

### Today Tab (Output)
- Daily task checklist from Beads
- One-tap completion
- Progress stats
- End-of-day sync to local Memory MCP

## Architecture

```
Phone (PWA) -> Railway Backend -> Home PC (Memory MCP @ localhost:8080)
                    |
                    v
             Ephemeral Buffer
          (deleted after sync)
```

## Deployment

### Railway (Backend + Frontend)

```bash
# Backend
cd backend
railway up

# Frontend (set VITE_API_URL to backend URL)
cd frontend
VITE_API_URL=https://your-backend.railway.app npm run build
railway up
```

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/capture` | POST | Create capture |
| `/api/capture` | GET | List captures |
| `/api/capture/{id}` | DELETE | Delete capture |
| `/api/tasks/today` | GET | Get today's tasks |
| `/api/tasks/{id}/complete` | POST | Mark complete |
| `/api/tasks/{id}/uncomplete` | POST | Mark incomplete |
| `/api/sync/daily-summary` | POST | End-of-day sync |
| `/health` | GET | Health check |

## Part of AI Exoskeleton

- **Level 1 CAPTURE**: This app (frictionless input)
- **Level 3 ORGANIZE**: life-os-dashboard (local)
- **Level 7 EXECUTE**: Beads task system

---

Built for the 2026 AI Exoskeleton project.
