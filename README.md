# Web Tester

An AI-powered web application tester with live browser streaming, bug reports, persistence, and retro UI themes.

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env   # add OPENAI_API_KEY or ANTHROPIC_API_KEY
```

Terminal 1: `cd apps/backend && npm run dev`  
Terminal 2: `cd apps/frontend && npm run dev`

Open http://localhost:5173

## Main features (Phases 0–7)

| Area | What you get |
|------|----------------|
| **Session** | Live CDP screencast, device profiles, AI tests in natural language |
| **Proyectos** | Projects, target apps, encrypted credentials, `storageState` |
| **Historial** | SQLite run history (pass/fail, duration) |
| **Bugs** | `reportBug` tool → `reports/` + viewer with screenshot |
| **Ajustes** | Postgres read-only URL, export/import JSON |
| **Tema visual** | Default, Win 3.11 / 95 / 98 / XP, Macintosh Classic II |

## Docs

Full roadmap: [PHASES.md](./PHASES.md)

## Paths (local, gitignored)

- `data/web-tester.sqlite` — projects, runs, settings  
- `reports/` — bug bundles  
- `.secrets/` — encrypted credentials + Playwright storage state  

## Environment

See [.env.example](./.env.example) for `AI_PROVIDER`, API keys, `DATABASE_URL`, `SECRETS_KEY`, ports.
