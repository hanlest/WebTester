# Web Tester - Implementation Phases

## ✅ Phase 0: Scaffolding (COMPLETE)

- ✅ Monorepo structure with npm workspaces
- ✅ TypeScript configuration (strict mode)
- ✅ Backend: Fastify + Playwright + WebSocket
- ✅ Frontend: React + Vite
- ✅ Shared types and constants
- ✅ Git initialization and .gitignore
- ✅ Build configuration for all workspaces

## ✅ Phase 1: Live Browser Streaming (COMPLETE)

- ✅ Backend: CDP screencast integration for live video stream
- ✅ Backend: Device profile support (desktop, iPhone, Pixel)
- ✅ Backend: Session management endpoints (start, stop)
- ✅ Backend: WebSocket streaming of frames + logs
- ✅ Frontend: Canvas-based live view of browser
- ✅ Frontend: Device profile selector
- ✅ Frontend: Activity log panel
- ✅ Frontend: URL input and session control UI

**Status**: Tested and working. Users can:
- Start a session against any public URL
- Select device profile (Desktop/iPhone 13/Pixel 5)
- View live browser stream in real-time
- See activity logs as the browser loads pages

---

## 📋 Phase 2: AI Agent (Guided & Autonomous Testing)

### Subtasks:
- [ ] Implement AIProvider interface (abstract class)
  - [ ] AnthropicProvider (Claude API)
  - [ ] OpenAIProvider
  - [ ] Provider selection via environment variable
- [ ] Implement browser automation tools:
  - [ ] `navigate(url)` - Navigate to page
  - [ ] `click(selector)` - Click element
  - [ ] `fill(selector, text)` - Fill input
  - [ ] `screenshot()` - Capture current screen
  - [ ] `getAccessibilityTree()` - Get page structure
  - [ ] `evaluateJS(code)` - Execute JavaScript
- [ ] Guided test execution:
  - [ ] Parse test case in natural language
  - [ ] Execute steps sequentially
  - [ ] Compare actual vs. expected results
  - [ ] Determine pass/fail
- [ ] Autonomous exploration:
  - [ ] Discover interactive elements
  - [ ] Navigate app without explicit guidance
  - [ ] Detect anomalies and potential bugs
- [ ] Frontend: Test case editor + execution controls
- [ ] Frontend: Real-time agent activity log

---

## 📋 Phase 3: Bug Detection & Reporting

### Subtasks:
- [ ] reportBug tool implementation:
  - [ ] Capture screenshot
  - [ ] Collect console logs
  - [ ] Extract network errors
  - [ ] Get DOM snapshot
  - [ ] Generate unique bug ID
- [ ] Report storage:
  - [ ] Markdown format with full context
  - [ ] JSON sidecar for machine parsing
  - [ ] Screenshot attachment
- [ ] Frontend: Bug report viewer
  - [ ] List all detected bugs per run
  - [ ] Bug detail panel (steps, images, DOM)
  - [ ] Mark bugs as reviewed/fixed
- [ ] Severity estimation (AI-based)

---

## 📋 Phase 4: App Authentication

### Subtasks:
- [ ] Target app configuration:
  - [ ] URL, device profiles, login selector
  - [ ] Credential storage (AES-256-GCM encrypted)
- [ ] Playwright session management:
  - [ ] storageState saving/loading
  - [ ] Automatic re-login on session expiry
- [ ] Multi-step login support (if needed)
- [ ] Frontend: Credentials form + encryption

---

## 📋 Phase 5: Database Integration (MVP)

### Subtasks:
- [ ] Postgres connector (read-only):
  - [ ] Connection string handling
  - [ ] Query execution
  - [ ] Result caching
- [ ] MySQL connector (phase 5b)
- [ ] queryDatabase tool:
  - [ ] Allow agent to run SELECT queries
  - [ ] Enforce read-only (reject INSERT/UPDATE/DELETE)
  - [ ] Include DB state changes in bug reports
- [ ] Database state snapshots:
  - [ ] Before/after test action
  - [ ] Diff detection for anomalies
- [ ] Frontend: DB connection config form

---

## 📋 Phase 6: Persistence & Polish

### Subtasks:
- [ ] SQLite database:
  - [ ] Projects schema
  - [ ] Target apps schema
  - [ ] Test cases schema
  - [ ] Runs & execution history
  - [ ] Bug index
- [ ] Frontend pages:
  - [ ] Projects management
  - [ ] Run history + results
  - [ ] Settings (AI provider, DB credentials, etc.)
- [ ] Local file export/import
- [ ] Performance optimization

---

## Current Status

**Ready to run**: Backend and frontend are fully functional for Phase 1.

To start developing Phase 2 (AI Agent), see `README.md` for startup instructions.

### Next Steps:
1. Implement AIProvider abstraction + Anthropic/OpenAI implementations
2. Add browser automation tools (navigate, click, fill, etc.)
3. Build guided test execution loop
4. Integrate autonomous exploration mode
