# ContextSwitch — AI Context & Session Recovery

AI-powered Chrome extension that remembers your work context, detects context switching, and lets you resume work instantly.

![Architecture](https://img.shields.io/badge/Architecture-Chrome%20Extension%20%2B%20Node.js%20%2B%20MongoDB-blue)
![Privacy](https://img.shields.io/badge/Privacy-Local%20Only%20Default-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome / Edge Extension                   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Side Panel  │  │  Background  │  │  Content Script    │ │
│  │  Dashboard   │  │  Service Wkr │  │  (Tab Observer)    │ │
│  └──────┬──────┘  └──────┬───────┘  └────────────────────┘ │
│         │                │                                   │
│  ┌──────┴──────┐  ┌──────┴───────┐                          │
│  │ AI Context  │  │   Context    │                          │
│  │   Engine    │  │    Engine    │                          │
│  └──────┬──────┘  └──────────────┘                          │
│         │                                                    │
│  ┌──────┴──────┐                                             │
│  │ chrome.     │                                             │
│  │ storage     │                                             │
│  └──────┬──────┘                                             │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js / Express Backend (Optional)           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Sessions │  │ Projects │  │ Settings │                  │
│  │  Routes  │  │  Routes  │  │  Routes  │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │              │              │                        │
│  ┌────┴──────────────┴──────────────┴─────┐                 │
│  │              MongoDB                   │                 │
│  └────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Extension Only (No Backend)

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome:
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

### Option 2: Full Stack with Docker

```bash
# Build the frontend
npm install
npm run build

# Start backend + MongoDB
docker compose up -d

# Load dist/ in Chrome (same as above)
```

### Option 3: Development

```bash
# Frontend dev server
npm run dev

# Backend dev server (separate terminal)
cd backend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `backend/.env`:

```bash
cp .env.example backend/.env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `MONGO_URI` | `mongodb://localhost:27017/contextswitch` | MongoDB connection string |
| `MONGO_USER` | `cs_admin` | MongoDB username |
| `MONGO_PASSWORD` | `cs_password_2024` | MongoDB password |

## API Endpoints

### Health
```
GET /api/health
→ { "status": "ok", "timestamp": "..." }
```

### Sessions
```
POST   /api/sessions          Create a session
GET    /api/sessions          List sessions (query: userId, projectId, limit, skip)
GET    /api/sessions/:id      Get session by ID
DELETE /api/sessions/:id      Delete session
```

### Projects
```
POST   /api/projects          Create a project
GET    /api/projects          List projects (query: userId)
```

### Settings
```
GET    /api/settings          Get user settings (query: userId)
PUT    /api/settings          Update user settings
```

## Privacy

ContextSwitch is built privacy-first:

- **Local Only by Default** — All data stays on your device in `chrome.storage.local`
- **No Cloud Sync** — Zero telemetry, analytics, or external data transmission
- **Sanitized AI** — If cloud AI is enabled, only domain names and tab titles are sent (no full URLs, passwords, or personal content)
- **Excluded Domains** — Block specific domains from being tracked
- **Clear on Exit** — Optional auto-delete of all data when browser closes
- **Delete Anytime** — One-click deletion of individual sessions or all data

### What Data is Collected

| Data | Where Stored | Sent Anywhere? |
|------|-------------|----------------|
| Tab URLs | chrome.storage.local | Never (Local mode) |
| Tab titles | chrome.storage.local | Never (Local mode) |
| Domain categories | chrome.storage.local | Never |
| Context switches | chrome.storage.local | Never |
| Session summaries | MongoDB (optional) | Only your server |
| API keys | chrome.storage.local | Never |

## Demo Mode

The extension includes an interactive demo walkthrough:

1. Click **"Start Demo Walkthrough"** in the dashboard
2. Watch as the demo simulates opening GitHub, Firebase Docs, Stack Overflow, and localhost
3. See ContextSwitch detect the **Smart Civic Reporter** project
4. The session is saved automatically
5. Click **"Resume My Work"** to restore all tabs and context

## Features

- **Real-time tab tracking** with domain categorization
- **Context score** measuring focus coherence
- **AI-powered** project and task detection (local heuristic + optional Gemini)
- **Session timeline** showing your work flow
- **Resume My Work** — restore tabs, context, and next steps
- **Recent Work** — project history with session counts
- **Distraction alerts** when context drift is detected
- **Privacy center** with full data control

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Extension**: Manifest V3, Chrome APIs (tabs, storage, sidePanel, alarms)
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB 7
- **AI**: Google Gemini (optional) + local heuristic engine
- **Deployment**: Docker Compose

## License

MIT
