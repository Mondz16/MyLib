# MyLib — Project-Based Learning Guide

**Stack:** React 19 (TypeScript) + .NET 10 Web API  
**Estimated Duration:** 12 active days (flexible)  
**Goal:** Learn React and .NET 10 by building a real, working application

---

## How to Use This Guide

The guide is split into focused documents, one per phase. Open them in order — each phase builds directly on the last.

Each document contains:
- **What you'll build** — the concrete deliverable for that phase
- **Step-by-step instructions** — exact commands and code snippets
- **Learning goals** — concepts you'll understand by the end
- **Checkpoint** — a checklist to verify you're ready to move on

> Work through the phases in order. Do not skip ahead.

---

## Documents

| # | Document | Topic | Days |
|---|---|---|---|
| 0 | [Phase-0-Prerequisites.md](docs/Phase-0-Prerequisites.md) | Tools to install before you start | — |
| 1 | [Phase-1-Project-Setup.md](docs/Phase-1-Project-Setup.md) | Scaffold backend + frontend, SQLite, CORS | 1–2 |
| 2 | [Phase-2-Authentication.md](docs/Phase-2-Authentication.md) | JWT auth, login/register forms, AuthContext | 3–5 |
| 3 | [Phase-3-Book-Search.md](docs/Phase-3-Book-Search.md) | Open Library proxy, search page, debounce | 6–7 |
| 4 | [Phase-4-Favorites.md](docs/Phase-4-Favorites.md) | Favorites CRUD, [Authorize], custom hook | 8–10 |
| 5 | [Phase-5-Polish.md](docs/Phase-5-Polish.md) | UX polish, Vite proxy, end-to-end run | 11–12 |
| 6 | [Phase-6-Stretch-Goals.md](docs/Phase-6-Stretch-Goals.md) | Pagination, modal, dark mode, deploy | Optional |
| — | [Quick-Reference.md](docs/Quick-Reference.md) | CLI commands, React patterns, JWT flow | — |

---

## Project Structure (Final)

```
Library/
├── PRD.md                        ← Product Requirements Document
├── LEARNING_GUIDE.md             ← This file (index)
├── docs/                         ← One document per phase
│   ├── Phase-0-Prerequisites.md
│   ├── Phase-1-Project-Setup.md
│   ├── Phase-2-Authentication.md
│   ├── Phase-3-Book-Search.md
│   ├── Phase-4-Favorites.md
│   ├── Phase-5-Polish.md
│   ├── Phase-6-Stretch-Goals.md
│   └── Quick-Reference.md
├── MyLib.Api/                    ← .NET 10 Web API (built in Phases 1–4)
└── mylib-client/                 ← React App (built in Phases 1–4)
```

---

## Start Here

Open **[docs/Phase-0-Prerequisites.md](docs/Phase-0-Prerequisites.md)** to get your machine set up, then move to Phase 1.
