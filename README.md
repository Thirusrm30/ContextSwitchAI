# ContextSwitch — AI Context Recovery Browser Extension (Layer 1)

**ContextSwitch** is an AI-ready Chrome & Edge browser extension (Manifest V3) designed to help knowledge workers, developers, and researchers maintain mental context, detect context switching, record work sessions, and seamlessly resume past tasks with one click.

---

## 🚀 Key Features in Layer 1

1. **ContextSwitch Brand & Real-Time Status Pulse** — Header with real-time status and live pulse indicator.
2. **Current Context Display** — Highlights active project focus and current task in real-time.
3. **Active Project** — Default mock: `Smart Civic Reporter`.
4. **Current Task** — Default mock: `Firebase Authentication`.
5. **Open Project Tabs** — Live tabs list:
   - *Firebase Documentation* (Docs)
   - *GitHub Repository* (Code)
   - *React Documentation* (Docs)
   - *Stack Overflow* (Q&A)
6. **Recent Sessions History** — Shows previous work sessions (*FinTrack AI Dashboard*, *MedVitals Wearable Telemetry*) with summaries, duration, and instant resume triggers.
7. **"Resume My Work" Action** — Primary hero action button to restore tabs and context memory with interactive preview modal.
8. **Context Switching Indicator & Score Gauge** — Circular progress gauge showing **87% Context Score**, focus coherence rating, and hourly context shifts.
9. **Privacy Status Badge** — 100% on-device Chrome storage indicator with zero tracking guarantee.
10. **Chrome Side Panel API & Storage API Integration** — Modular architecture with `chrome.storage.local` and fallback for standard browser testing.

---

## 🛠️ Project Structure

```
contextswitch/
├── extension/
│   ├── manifest.json              # Chrome Manifest V3 configuration
│   ├── background/
│   │   └── service-worker.ts      # Service worker managing side panel behavior
│   ├── content/
│   │   └── content.ts             # Content script listener
│   ├── sidepanel/
│   │   └── sidepanel.html         # HTML entry point for the side panel
│   └── assets/                    # Icons (16x16, 32x32, 48x48, 128x128)
├── src/
│   ├── components/
│   │   ├── Header.tsx             # Brand header with status pulse & refresh
│   │   ├── CurrentContextCard.tsx # Active project, task & context switch tracker
│   │   ├── ContextScoreGauge.tsx  # Circular score gauge (87%) & focus rating
│   │   ├── OpenTabsList.tsx       # Live tabs in context with category tags
│   │   ├── RecentSessions.tsx     # Past session history & quick resume
│   │   ├── PrivacyStatusBadge.tsx # Privacy & security guarantees
│   │   ├── ResumeWorkModal.tsx    # Session restore confirmation dialog
│   │   └── QuickActions.tsx       # "Resume My Work" CTA button
│   ├── pages/
│   │   └── SidePanelDashboard.tsx # Master layout assembling all components
│   ├── services/
│   │   ├── storageService.ts      # Chrome Storage API + LocalStorage fallback
│   │   └── mockData.ts            # High-fidelity mock state for Layer 1
│   ├── types/
│   │   └── context.ts             # TypeScript data contracts
│   ├── utils/
│   │   └── formatters.ts          # Score & category helpers
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # React DOM render mount
│   └── index.css                  # Tailwind styles + dark SaaS theme
├── public/
│   └── icons/                     # Packaged extension icons
├── package.json
├── vite.config.ts                 # Multi-input bundle config for Manifest V3
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 📦 How to Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) (v18+) installed.

In the project root directory, run:

```bash
npm install
```

---

## 🔨 How to Build the Extension

To compile TypeScript and bundle the extension into the `dist/` directory:

```bash
npm run build
```

The output will be placed in the `dist/` folder:
- `dist/manifest.json`
- `dist/extension/sidepanel/sidepanel.html`
- `dist/background/service-worker.js`
- `dist/content/content.js`
- `dist/icons/`
- `dist/assets/`

---

## 🌐 How to Load into Chrome or Edge

1. Open your browser:
   - **Google Chrome**: Navigate to `chrome://extensions/`
   - **Microsoft Edge**: Navigate to `edge://extensions/`
2. Turn ON the **"Developer mode"** toggle in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left toolbar.
4. Select the **`dist`** folder inside your project directory (`c:\Users\THIRU SELVAN\OneDrive\Desktop\buildthon prj\dist`).
5. **ContextSwitch** will appear in your extension list!

---

## 🖥️ How to Test the Side Panel

1. In Chrome / Edge, click the **Extensions icon** (puzzle piece) in the top-right toolbar.
2. Click the **ContextSwitch** icon (or pin it to the toolbar and click it).
3. The Chrome Side Panel will immediately open on the right side of the browser window showing the **ContextSwitch Dashboard**.
4. You can also test locally in a standard browser tab during development:
   ```bash
   npm run dev
   ```
   and navigate to `http://localhost:5173/extension/sidepanel/sidepanel.html`.

---

## 🧩 Ready for Next Layers

This foundation is modularly structured so that subsequent layers can easily plug in:
- **Layer 2**: Real browser Tab & Window Tracking APIs (`chrome.tabs.onUpdated`, `chrome.tabs.onActivated`).
- **Layer 3**: Local / Cloud AI Embedding & LLM Summarization for automated task identification.
- **Layer 4**: Authentication & Backend Sync with MongoDB & Docker.
