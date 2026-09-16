# Web Tester - Implementation Phases

## ✅ Phase 0–2

See git history. Live streaming + AI-guided tests are implemented.

---

## ✅ Phase 3: Bug Detection & Reporting (COMPLETE)

- ✅ `reportBug` agent tool (screenshot, console, network errors, DOM, severity)
- ✅ Reports under `reports/{bugId}/` (Markdown + JSON + PNG)
- ✅ SQLite bug index + REST API (`/api/bugs`, screenshot, mark reviewed)
- ✅ Frontend bug viewer (Bugs tab)

---

## ✅ Phase 4: App Authentication (COMPLETE)

- ✅ Target apps per project with login selectors
- ✅ Credentials encrypted (AES-256-GCM) in `.secrets/`
- ✅ Playwright `storageState` load on session start when target app is selected
- ✅ Auto-save `storageState` after successful test run
- ✅ Manual save: `POST /api/session/:sessionId/save-storage/:targetAppId`
- ✅ Frontend credentials form (Projects tab)

---

## ✅ Phase 5: Database Integration (MVP) (COMPLETE)

- ✅ Postgres connector (read-only SELECT validation)
- ✅ `queryDatabase` agent tool
- ✅ `DATABASE_URL` env + persisted setting via API
- ✅ Frontend DB connection in Settings

---

## ✅ Phase 6: Persistence & Polish (COMPLETE)

- ✅ SQLite (`data/web-tester.sqlite`): projects, target apps, test cases, runs, bug index, settings
- ✅ REST APIs for projects, apps, test cases, runs
- ✅ Run history UI
- ✅ Export/import JSON (`/api/export`, `/api/import`)

---

## ✅ Phase 7: Visual Themes (COMPLETE)

- ✅ Theme engine (`data-visual-theme`, CSS variables, `visual-themes.css`)
- ✅ Selector in sidebar with `localStorage` persistence
- ✅ Themes: **default**, **Windows 3.11**, **95**, **98**, **XP**, **Macintosh Classic II**

---

## Optional / future

- [ ] Phase 2b: Autonomous exploration mode
- [ ] MySQL connector (5b)
- [ ] Full pixel-perfect OS chrome recreation
- [ ] Performance tuning at scale

---

## Current Status

**Phases 0–7 implemented.** Restart backend + frontend after pull.

Recommended: configure `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, create a target app under **Proyectos**, save QA credentials, start session with target app selected, run AI test.
