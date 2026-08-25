# ContextSwitch — Layer 1: Project Foundation Plan

## Goal
Build the initial foundation for **ContextSwitch**, an AI-ready Chrome/Edge browser extension (Manifest V3) with React, Vite, TypeScript, Tailwind CSS, and Chrome Side Panel API.

## Proposed Architecture & Structure
```
buildthon prj/
├── extension/
│   ├── manifest.json              # Chrome Manifest V3 configuration with side_panel permission
│   ├── background/
│   │   └── service-worker.ts      # Service worker configuring side panel behavior & action triggers
│   ├── content/
│   │   └── content.ts             # Content script hook for page metadata extraction
│   └── sidepanel/
│       └── sidepanel.html         # HTML entry point for the side panel React dashboard
├── src/
│   ├── components/
│   │   ├── Header.tsx             # ContextSwitch brand, live status pulse, quick theme/settings
│   │   ├── CurrentContextCard.tsx # Active Project, Task, Duration & Context Switch alert
│   │   ├── ContextScoreGauge.tsx  # Dynamic circular score meter (87% Focus Rating)
│   │   ├── OpenTabsList.tsx       # Live open tabs under active project with status indicators
│   │   ├── RecentSessions.tsx     # Past project sessions history with instant resume trigger
│   │   ├── PrivacyStatusBadge.tsx # Privacy & on-device status indicator
│   │   ├── ResumeWorkModal.tsx    # Modal/banner confirming instant context restoration
│   │   └── QuickActions.tsx       # Session snapshot, bookmark, switch project
│   ├── pages/
│   │   └── SidePanelDashboard.tsx # Main dashboard layout combining all UI elements
│   ├── services/
│   │   ├── storageService.ts      # Wrapper around chrome.storage.local with browser localStorage fallback
│   │   ├── sessionService.ts      # Session & project state management
│   │   └── mockData.ts            # High-fidelity mock data for Layer 1
│   ├── types/
│   │   └── context.ts             # TypeScript interfaces for sessions, tabs, context score, projects
│   ├── utils/
│   │   └── formatters.ts          # Formatting dates, durations, and score helpers
│   ├── App.tsx                    # Root React component
│   ├── main.tsx                   # React root mount
│   └── index.css                  # Tailwind styles + custom modern glassmorphic theme
├── public/
│   └── icons/                     # Icons (16x16, 48x48, 128x128)
├── package.json
├── vite.config.ts                 # Multi-input Vite build config for Extension + Sidepanel
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── README.md                      # Comprehensive guide for setup, load, and test
```

## User Review Required
- Layer 1 focuses strictly on foundational frontend, Side Panel UI, mock data, and extension bundle packaging without external backend/AI dependencies.

## Verification Plan
1. `npm install` to install all dependencies cleanly.
2. `npm run build` to verify standard TypeScript compilation and Vite multi-target bundling into `dist/`.
3. Verify that `dist/` contains:
   - `manifest.json` (Manifest V3)
   - `sidepanel.html` & linked JS/CSS
   - `service-worker.js`
   - `content.js`
   - `icons/`
4. Provide instructions on loading unpacked extension in Chrome/Edge and launching the Side Panel.
