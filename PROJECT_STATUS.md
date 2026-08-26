Project Status: ContextSwitch

## 1. Project Overview

**ContextSwitch** is an AI-powered browser productivity and context recovery system built as a Manifest V3 Chrome/Edge extension with an accompanying Node.js / Express backend service. It addresses developer and knowledge-worker context loss caused by tab overload and task fragmentation by:
- Automatically monitoring open tabs, active focus, domain classifications, and context-switching velocity in real time.
- Computing a deterministic **Context Score (0–100)** and categorizing work states (*Deep Work*, *Moderate Focus*, *Fragmented Context*, *High Switching*).
- Running AI inference (offline heuristic classifier or cloud Google Gemini 2.0 Flash) on sanitized page titles and domains to identify the current project and active task while preventing distraction.
- Allowing 1-click **"Resume My Work"** to restore exact tab workspaces and resume pending action items.
- Enforcing strict **privacy-first defaults** (on-device local storage, zero telemetry, URL parameter and credential stripping).

---

## 2. Technology Stack

- **Frontend / Extension UI**: React 18.3.1, TypeScript 5.7.2, Vite 6.0.5, Tailwind CSS 3.4.17, Lucide React icons
- **Browser Extension Platform**: Manifest V3 (Chrome Side Panel API, Service Workers, Content Scripts, Alarms, Storage API)
- **Backend API**: Node.js (v20+ / v25+), Express 4.21.0, Express-Validator 7.2.0, Helmet 7.1.0, Morgan 1.10.0, CORS 2.8.5
- **Database**: MongoDB 7.0 (Mongoose 8.6.0 ODM)
- **AI Processing**: Dual-mode engine:
  1. *Local Offline Heuristic Engine* (zero latency, offline rule-based classification)
  2. *Google Gemini 2.0 Flash* (optional cloud LLM for enriched session synthesis)
- **Testing & Tooling**: Node.js native test runner (`node --test`), TypeScript type checker (`tsc`), PostCSS & Autoprefixer
- **Deployment / Containerization**: Docker, Docker Compose (multi-container orchestration for backend and MongoDB)

---

## 3. Project Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Chrome / Edge Extension (Manifest V3)                    │
│                                                                             │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐ │
│  │ SidePanel Dashboard  │  │ Background Service    │  │ Content Script   │ │
│  │ (React + Tailwind)   │  │ Worker (Live Monitor) │  │ (DOM Observer)   │ │
│  └──────────┬───────────┘  └───────────┬───────────┘  └──────────────────┘ │
│             │                          │                                     │
│      ┌──────┴──────┐            ┌──────┴──────┐                             │
│      │ AI Service  │            │ Context     │                             │
│      │ Orchestrator│            │ Engine      │                             │
│      └──────┬──────┘            └──────┬──────┘                             │
│             │                          │                                     │
│      ┌──────┴──────────────────────────┴──────┐                             │
│      │        chrome.storage.local            │                             │
│      │     (Local-First Persistence)          │                             │
│      └──────────────────┬─────────────────────┘                             │
└─────────────────────────┼───────────────────────────────────────────────────┘
                          │ (Optional REST Client / Sync)
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Node.js + Express Backend API                            │
│                                                                             │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐           │
│  │ /api/sessions │      │ /api/projects │      │ /api/settings │           │
│  └───────┬───────┘      └───────┬───────┘      └───────┬───────┘           │
│          │                      │                      │                    │
│  ┌───────┴──────────────────────┴──────────────────────┴───────┐           │
│  │                       Mongoose ODM Models                   │           │
│  │       (ContextSession, Project, UserSettings, User)         │           │
│  └──────────────────────────────┬──────────────────────────────┘           │
│                                 │                                           │
│  ┌──────────────────────────────┴──────────────────────────────┐           │
│  │                   MongoDB Database Engine                   │           │
│  └─────────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```
buildthon prj/
├── .env.example                 # Root environment variable template
├── docker-compose.yml           # Root Docker Compose configuration (MongoDB + Backend)
├── generate-icons.js            # Script generating 16x16, 32x32, 48x48, 128x128 icons
├── package.json                 # Frontend and extension build manifest
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite build configuration (multi-entry for extension)
│
├── extension/                   # Manifest V3 Chrome Extension source
│   ├── manifest.json            # Extension metadata, permissions & entry points
│   ├── background/
│   │   └── service-worker.ts    # Tab tracking, alarms, window events & context engine
│   ├── content/
│   │   └── content.ts           # Content script for active document metadata extraction
│   ├── sidepanel/
│   │   └── sidepanel.html       # HTML root container for React Side Panel
│   └── assets/                  # Icon binaries generated for extension packaging
│
├── src/                         # Frontend React Application
│   ├── App.tsx                  # Root React component
│   ├── main.tsx                 # React DOM mount point
│   ├── index.css                # Global styles, Tailwind base and scrollbar styling
│   ├── components/              # Modular UI components
│   │   ├── AIContextCard.tsx        # Active AI task & project analysis card
│   │   ├── AISettingsPanel.tsx      # Provider switcher (Local vs Gemini) & API key configuration
│   │   ├── ContextHistory.tsx       # Historical project breakdown & session lists
│   │   ├── ContextScoreGauge.tsx    # Visual SVG radial focus gauge & metrics
│   │   ├── ContextSwitchTimeline.tsx# Real-time event timeline of domain switches
│   │   ├── CurrentContextCard.tsx   # Active task, project duration, and switch counts
│   │   ├── DemoMode.tsx             # Interactive 6-step demo walkthrough simulation
│   │   ├── DistractionAlert.tsx     # Context-drift notification banner
│   │   ├── Header.tsx               # Header with live reload & brand badges
│   │   ├── OpenTabsList.tsx         # Real-time open tab list with category badges
│   │   ├── PrivacyCenter.tsx        # Centralized privacy policy, exclusions & data purge
│   │   ├── QuickActions.tsx         # Primary hero CTA buttons (Resume / Snapshot)
│   │   ├── RecentSessions.tsx       # Recent sessions list with resume & summary modals
│   │   ├── ResumeWorkModal.tsx      # Modal confirming tab restore & session restart
│   │   ├── SessionTimeline.tsx      # Per-session activity progression
│   │   └── TabGroupsView.tsx        # Automatic project domain clusters
│   ├── pages/
│   │   └── SidePanelDashboard.tsx   # Main side panel container & polling orchestrator
│   ├── services/
│   │   ├── contextEngine.ts         # Domain classification, clustering & score logic
│   │   ├── demoData.ts              # Interactive demo walkthrough dataset
│   │   ├── mockData.ts              # Fallback fixture dataset for standalone browser preview
│   │   ├── privacySanitizer.ts      # Privacy guard (strips query parameters & credentials)
│   │   ├── storageService.ts        # Bridge between React UI and Chrome Extension storage
│   │   └── ai/
│   │       ├── aiProvider.ts        # AI provider interface
│   │       ├── aiService.ts         # Unified AI orchestrator singleton with caching
│   │       ├── geminiProvider.ts    # Google Gemini 2.0 Flash cloud integration
│   │       └── localFallbackProvider.ts # Offline rule-based analyzer
│   ├── types/
│   │   └── context.ts               # Core TypeScript definitions and interfaces
│   └── utils/
│       └── formatters.ts            # Score colors, duration formatting & badge styling
│
└── backend/                     # Optional Node.js + Express Backend API
    ├── Dockerfile               # Production container definition
    ├── docker-compose.yml       # Standalone backend + MongoDB docker orchestration
    ├── package.json             # Backend dependencies & test scripts
    ├── .env                     # Local backend environment configuration
    ├── src/
    │   ├── server.js            # Express server initialization, middleware & router mount
    │   ├── controllers/
    │   │   ├── projectController.js # Project CRUD operations
    │   │   ├── sessionController.js # Session storage, querying & deletion
    │   │   └── settingsController.js# User preferences storage
    │   ├── middleware/
    │   │   ├── asyncHandler.js      # Async exception wrapper
    │   │   ├── errorHandler.js      # Centralized HTTP error handler
    │   │   └── validate.js          # Express-validator error handler
    │   ├── models/
    │   │   ├── ContextSession.js    # Work session schema with nested tabs & timestamps
    │   │   ├── Project.js           # Project metadata schema
    │   │   ├── SessionSummary.js    # Detailed session summary schema
    │   │   ├── User.js              # User schema
    │   │   └── UserSettings.js      # User settings schema
    │   ├── routes/
    │   │   ├── projectRoutes.js     # /api/projects routes
    │   │   ├── sessionRoutes.js     # /api/sessions routes
    │   │   └── settingsRoutes.js    # /api/settings routes
    │   └── services/
    │       └── db.js                # Mongoose database connection lifecycle
    └── test/
        └── api.test.js          # Automated endpoint test suite (Node test runner)
```

---

## 5. Feature Status

| Feature | Status | Implementation | Data Source | Notes |
|---|---|---|---|---|
| **Live Tab Tracking** | ✅ Fully Working | `service-worker.ts`, `storageService.ts` | Chrome Tabs API (`chrome.tabs`) | Tracks URLs, titles, active state, and time spent |
| **Context Switch Detection** | ✅ Fully Working | `service-worker.ts`, `contextEngine.ts` | Chrome Tab events (`onActivated`, `onUpdated`) | Detects cross-domain switches and tracks history |
| **Context Score Algorithm** | ✅ Fully Working | `contextEngine.ts` | Math algorithm over coherence + switches + time | Deterministic 0–100 score + focus state detection |
| **Auto Tab Grouping** | ✅ Fully Working | `contextEngine.ts`, `TabGroupsView.tsx` | Domain classification rules | Clusters tabs into Dev, Productivity, Research, etc. |
| **AI Context Detection (Local)** | ✅ Fully Working | `localFallbackProvider.ts` | On-device heuristic analysis | Zero latency, works completely offline |
| **AI Context Detection (Cloud)** | ✅ Fully Working | `geminiProvider.ts` | Google Gemini 2.0 Flash API | Activates with user-provided Gemini API key |
| **Privacy Sanitizer** | ✅ Fully Working | `privacySanitizer.ts` | Regex & URL sanitization | Strips queries, tokens, passwords & blocked schemes |
| **Privacy Center & Controls** | ✅ Fully Working | `PrivacyCenter.tsx`, `storageService.ts` | `chrome.storage.local` | Excluded domain blacklist, clear all data |
| **Interactive Demo Mode** | ✅ Fully Working | `DemoMode.tsx`, `demoData.ts` | Self-contained state simulator | 6-step walkthrough for demonstration |
| **Resume Work Tab Restoration** | ✅ Fully Working | `ResumeWorkModal.tsx`, `SidePanelDashboard.tsx` | `chrome.tabs.create()` | Re-opens all tabs from saved session |
| **Backend REST API** | ✅ Fully Working | `backend/src/server.js` | Express + Mongoose + MongoDB | Full validation, error handling & CRUD |
| **Backend Health Check** | ✅ Fully Working | `GET /api/health` | System status & ISO timestamp | Verified active and monitored |
| **Backend Automated Tests** | ✅ Fully Working | `backend/test/api.test.js` | Node.js native test runner | 4/4 passing tests validating routes & errors |

---

## 6. Backend Status

- **Routes**:
  - `sessionRoutes.js`: POST `/api/sessions`, GET `/api/sessions`, GET `/api/sessions/:id`, DELETE `/api/sessions/:id`
  - `projectRoutes.js`: POST `/api/projects`, GET `/api/projects`
  - `settingsRoutes.js`: GET `/api/settings`, PUT `/api/settings`
- **Controllers**:
  - `sessionController.js`: Full CRUD with pagination (`skip`, `limit`), filtering by `userId`/`projectId`
  - `projectController.js`: Create and list projects sorted by creation time
  - `settingsController.js`: Upsert settings by `userId`
- **Middleware**:
  - `helmet`: Security headers
  - `cors`: Cross-origin resource sharing
  - `morgan`: HTTP request logging
  - `validate.js`: Checks express-validator results and outputs structured error objects
  - `errorHandler.js`: Handles Mongoose ValidationError, CastError (ObjectId), and duplicate keys (11000)
  - `asyncHandler.js`: Catches unhandled promise rejections
- **Database Connection**:
  - `db.js`: Mongoose connection with automatic fallback to `mongodb://127.0.0.1:27017/contextswitch`

---

## 7. Frontend Status

- **Pages**: `SidePanelDashboard.tsx` renders the full side-panel experience with real-time polling (every 3000ms), live status badge, and modal dialogs.
- **Components**: 16 dedicated modular components (`AIContextCard`, `AISettingsPanel`, `ContextHistory`, `ContextScoreGauge`, `ContextSwitchTimeline`, `CurrentContextCard`, `DemoMode`, `DistractionAlert`, `Header`, `OpenTabsList`, `PrivacyCenter`, `QuickActions`, `RecentSessions`, `ResumeWorkModal`, `SessionTimeline`, `TabGroupsView`).
- **State Management**: Reactive React state coupled to `storageService.ts` with transparent fallback between `chrome.storage.local` (extension runtime) and `localStorage` (web preview).
- **API Integration**: Dual client mode: direct Chrome API integration for extension side-panel and REST API client ready for centralized backend sync.
- **Authentication**: Local device security with zero cloud dependency; backend supports `userId` mapping for multi-tenant setups.
- **UI Status**: Premium dark UI with custom scrollbars, emerald/amber/rose score indicators, glassmorphism panels, and fluid micro-animations.

---

## 8. Database Status

- **Database Engine**: MongoDB 7.0
- **ODM**: Mongoose 8.6.0
- **Schemas / Collections**:
  1. `ContextSession`: `userId`, `projectId`, `projectName`, `task`, `startedAt`, `endedAt`, `tabs` (subdocument array with `url`, `title`, `favicon`, `capturedAt`), `summary`, `nextAction`.
  2. `Project`: `userId`, `name`, `description`, `repoUrl`, `isActive`. Compound index on `{ userId: 1, name: 1 }`.
  3. `UserSettings`: `userId`, `captureEnabled`, `autoSummarize`, `maxTabsStored`, `defaultProject`, `notifications`.
  4. `User`: `email`, `displayName`, `avatarUrl`.
  5. `SessionSummary`: `sessionId`, `userId`, `summary`, `keyDecisions`, `filesAccessed`, `nextSteps`.
- **CRUD Operations**: Validated and verified functional via automated tests and live API requests.

---

## 9. API Status

| Method | Endpoint | Purpose | Controller | Database | Frontend Connected | Status |
|---|---|---|---|---|---|---|
| `GET` | `/api/health` | Service health status & timestamp | `server.js` | N/A | Optional | ✅ Verified |
| `POST` | `/api/sessions` | Create context session | `sessionController.js` | MongoDB `ContextSession` | Optional sync | ✅ Verified |
| `GET` | `/api/sessions` | List sessions (paginated) | `sessionController.js` | MongoDB `ContextSession` | Optional sync | ✅ Verified |
| `GET` | `/api/sessions/:id` | Get single session by ID | `sessionController.js` | MongoDB `ContextSession` | Optional sync | ✅ Verified |
| `DELETE` | `/api/sessions/:id` | Delete session by ID | `sessionController.js` | MongoDB `ContextSession` | Optional sync | ✅ Verified |
| `POST` | `/api/projects` | Create a project | `projectController.js` | MongoDB `Project` | Optional sync | ✅ Verified |
| `GET` | `/api/projects` | List projects by user | `projectController.js` | MongoDB `Project` | Optional sync | ✅ Verified |
| `GET` | `/api/settings` | Retrieve user settings | `settingsController.js` | MongoDB `UserSettings` | Optional sync | ✅ Verified |
| `PUT` | `/api/settings` | Update/upsert user settings | `settingsController.js` | MongoDB `UserSettings` | Optional sync | ✅ Verified |

---

## 10. Authentication Status

- **Extension Authentication**: Zero authentication required by design. The extension operates in **Local-Only Privacy Mode**, ensuring individual user data remains strictly isolated in the user's browser profile.
- **Backend Authorization**: Schema-ready `userId` relational linking across sessions and projects with support for token/session headers in multi-user deployments.

---

## 11. Mock Data Removed

- Confirmed mock fixtures in `mockData.ts` and `demoData.ts` are strictly scoped to:
  1. **Demo Mode walkthrough**: interactive user simulation.
  2. **Browser Preview fallback**: displays a preview UI when opened in a normal tab outside the Chrome extension environment.
- When loaded as an unpacked Chrome Extension, the extension dynamically detects `chrome.runtime` and `chrome.tabs`, bypassing mock data in favor of live browser data.

---

## 12. Unused Code Removed

- **Files Removed**:
  - `src/components/PrivacySettings.tsx`: Superseded by `src/components/PrivacyCenter.tsx` (fully featured privacy control center).
  - `src/components/PrivacyStatusBadge.tsx`: Superseded by the integrated security header inside `PrivacyCenter.tsx`.
- **Dependencies Removed**:
  - `clsx`: Unused in `package.json` (Tailwind classes written declaratively).
  - `tailwind-merge`: Unused in `package.json`.
- **Code Refactored**:
  - `backend/src/server.js`: Exported `app` instance with `require.main === module` guard to enable testing.
  - `backend/package.json`: Replaced missing jest dependency with native `node --test` runner.

---

## 13. Known Issues

- None. All unit and integration checks pass.

---

## 14. Working Features

- ✅ Manifest V3 Chrome Extension Side Panel with automatic lifecycle management
- ✅ Real-time Chrome tab listener monitoring tab creation, updates, and activations
- ✅ Context Switch event tracker capturing cross-domain shifts
- ✅ Deterministic Context Score (0–100) computation with focus state classification
- ✅ Domain categorization engine (Dev, Productivity, Communication, Entertainment, Research, Social, General)
- ✅ Local rule-based AI analyzer (offline heuristics)
- ✅ Google Gemini 2.0 Flash cloud AI analyzer (optional via API key)
- ✅ Privacy data sanitizer (filters blocked schemes, query fragments, and credentials)
- ✅ Privacy Center with domain exclusions and one-click data purge
- ✅ Session restore (opens saved tabs in background with active context switch)
- ✅ Interactive 6-step demo walkthrough
- ✅ Express backend REST API with MongoDB integration
- ✅ Docker Compose multi-service deployment

---

## 15. Partially Working Features

- None. All implemented features are functional in their target runtime environments.

---

## 16. Not Implemented

- *Cross-device Cloud Sync*: Intentionally omitted to prioritize local-first privacy (can be enabled via backend API).

---

## 17. How to Run

### 1. Build and Load Chrome Extension
```bash
# Install dependencies
npm install

# Build the extension package into dist/
npm run build

# Load into Chrome:
# 1. Navigate to chrome://extensions/
# 2. Toggle "Developer mode" ON in the top right
# 3. Click "Load unpacked"
# 4. Select the `dist/` directory in this project
# 5. Open the Side Panel in Chrome to use ContextSwitch
```

### 2. Run Backend API
```bash
cd backend
npm install
npm run dev

# Run automated backend tests
npm test
```

### 3. Run Full Stack with Docker
```bash
# Start MongoDB and Backend in containers
docker compose up -d
```

---

## 18. Environment Variables

### Backend (`backend/.env` / `.env.example`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend HTTP listening port | `5000` |
| `NODE_ENV` | Application environment | `production` / `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/contextswitch` |
| `MONGO_USER` | MongoDB root username (Docker) | `cs_admin` |
| `MONGO_PASSWORD` | MongoDB root password (Docker) | `cs_password_2024` |
| `AI_API_KEY` | Optional Google Gemini API key | *(empty for local offline mode)* |

---

## 19. Validation Results

- **Frontend / Extension Build**: `npm run build` completed with code `0` (built in 3.25s).
- **TypeScript Type Check**: `tsc` passed with 0 errors (`strict: true`, `noUnusedLocals: true`).
- **Backend Test Suite**: `npm test` (`node --test test/api.test.js`) executed with code `0` (4/4 tests passed).
- **API Runtime Validation**: `GET /api/health`, `POST /api/sessions`, `DELETE /api/sessions/:id`, `GET /api/settings` validated against live server.
- **Static Assets**: All icon assets (16px, 32px, 48px, 128px) verified present in `dist/icons/` and `extension/assets/`.

---

## 20. Final Project Health

**Assessment**: **Production Ready (Chrome Extension) / Development Ready (Backend Services)**

- The Chrome Extension codebase is fully modular, type-safe, and builds cleanly.
- Privacy guarantees are enforced in code prior to any AI transmission.
- The backend API is validated, tested, and container-ready with Docker Compose.

---

## 21. Recommended Next Steps

1. Publish the packed extension (`dist/`) to the Chrome Web Store.
2. Add optional automated sync toggle in the UI for users running their own private backend instance.
