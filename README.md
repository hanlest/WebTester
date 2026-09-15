# Web Tester

An AI-powered web application tester with live browser streaming, supporting desktop and mobile viewport profiles.

## Architecture

- **Backend** (`apps/backend`): Node.js + Fastify + Playwright + WebSocket for live browser streaming via CDP screencast
- **Frontend** (`apps/frontend`): React + Vite + TypeScript with live canvas view and activity log
- **Shared** (`packages/shared`): TypeScript types and constants for WebSocket communication

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1. Install dependencies:

```bash
npm install
```

2. Download Playwright browsers:

```bash
npx playwright install chromium
```

## Development

Open two terminals:

### Terminal 1: Backend

```bash
cd apps/backend
npm run dev
```

The backend will start on `http://localhost:3001`

### Terminal 2: Frontend

```bash
cd apps/frontend
npm run dev
```

The frontend will open at `http://localhost:5173`

## Usage

1. Open the frontend in your browser (http://localhost:5173)
2. Enter a target URL (e.g., `https://example.com`)
3. Select a device profile (Desktop, iPhone 13, or Pixel 5)
4. Click "Start Session"
5. View the live browser stream and activity log

## Project Structure

```
web-tester/
├── apps/
│   ├── backend/        # Fastify API + Playwright automation
│   └── frontend/       # React UI with live stream viewer
├── packages/
│   └── shared/         # Shared TypeScript types
├── reports/            # Generated bug reports (gitignored)
└── .secrets/           # Encrypted credentials (gitignored)
```

## Features (Implemented)

- ✅ Live browser streaming via CDP screencast + WebSocket
- ✅ Desktop and mobile (iPhone/Pixel) viewport emulation
- ✅ Session management (start/stop)
- ✅ Activity logging

## Features (Planned - Future Phases)

- AI-powered test execution (guided + autonomous exploration)
- Bug detection and reporting (Markdown + JSON)
- Database query support (read-only)
- App authentication/login support
- Multi-provider AI support (Anthropic, OpenAI)
- Local persistence (SQLite)
- Encrypted credential storage

## Development Notes

- Both apps use TypeScript with strict mode enabled
- The monorepo is configured with npm workspaces
- Build output is gitignored; artifacts are in `dist/` directories
