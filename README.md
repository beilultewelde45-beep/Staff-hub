# StaffHub — HR Management System

Web-based HRMS covering recruitment → onboarding → records → attendance → leave → payroll → assets → offboarding.
Currency **UGX**, time zone **Africa/Kampala (UTC+3, no DST)**. No biometrics, no GPS.

**Deadline:** Day 10 = **Mon 30 Nov 2026** (plan starts Sat 21 Nov 2026).

## Status

| Epic | State |
|------|-------|
| E1 Foundation (auth, RBAC, layout, time/money helpers, audit log, seed, tests) | ✅ done |
| E2–E9 | not started — see [docs/07-tasks.md](docs/07-tasks.md) |

## Quick start

Requires Node.js 20+.

```bash
npm install
```

**Without a database (quickest):** runs against a throwaway in-memory MongoDB, already seeded. Data is lost when it stops.

```bash
npm run dev:mem
```

**With MongoDB Atlas:**

```bash
cp .env.example .env      # fill MONGODB_URI and SESSION_SECRET
npm run seed              # demo users for every role (safe to re-run)
npm run dev               # http://localhost:3000, restarts on file changes
```

Run the tests (uses an in-memory MongoDB, no `.env` needed):

```bash
npm test
```

## Demo accounts

Password for all: `Passw0rd!` — change before any real use.

| Email | Roles |
|-------|-------|
| admin@staffhub.test | admin |
| hr@staffhub.test | hr, employee |
| recruiter@staffhub.test | recruiter, employee |
| manager@staffhub.test | manager, employee |
| payroll@staffhub.test | payroll, employee |
| assets@staffhub.test | asset, employee |
| employee@staffhub.test | employee |

Each account sees only its own menu items. Items for modules that aren't built yet are shown greyed out with a "soon" tag.

## Project layout

```
server.js         start-up: env check → DB → app.listen
app.js            Express app (middleware order, routes) — imported by tests
config/           env, db, session, roles, nav (sidebar per role)
middleware/       auth (loadUser, requireAuth, requireRole), locals, errors
models/           Mongoose models (User, AuditLog, …)
services/         business rules live here, never in routes (auditService, …)
routes/           thin: validate → call service → render/redirect
utils/            time (Kampala), money (UGX), password, errors, stateMachine
views/            EJS: layouts/, partials/, <module>/
public/           app.css, app.js
seed/             demo data
scripts/          dev-memory.js
tests/            node:test + supertest + mongodb-memory-server
docs/             plan documents (below)
```

## Plan documents

| # | Document | What's in it |
|---|----------|--------------|
| 1 | [Scope & requirements](docs/01-scope-and-requirements.md) | Roles, modules, MVP vs stretch, assumptions, open questions |
| 2 | [Architecture](docs/02-architecture.md) | Stack, folder layout, auth & RBAC, privacy, time/money handling, audit, jobs |
| 3 | [Data model](docs/03-data-model.md) | Every collection, fields, indexes, status machines |
| 4 | [Business rules → enforcement](docs/04-business-rules.md) | Each rule from the brief, where it's enforced and how it's tested |
| 5 | [Screens & routes](docs/05-screens-and-routes.md) | Every page/route and which roles can use it |
| 6 | [10-day schedule](docs/06-schedule.md) | Day-by-day plan, milestones, cut list, risks |
| 7 | [Task breakdown](docs/07-tasks.md) | ~70 tasks with IDs, estimates, dependencies, acceptance criteria |
| 8 | [Testing & demo](docs/08-testing-and-demo.md) | Seed data, rule test checklist, demo script |

**Mockup:** open [mockups/staffhub-mockup.html](mockups/staffhub-mockup.html) in a browser (clickable, role switcher top-right).

## Stack

Node.js 20+ (ES modules) · Express 4 · EJS + express-ejs-layouts · MongoDB Atlas + Mongoose 8 · express-session + connect-mongo · bcrypt · dayjs (utc + timezone) · helmet · csrf-sync · express-validator · express-rate-limit. Deploy: Render (web) + Atlas (DB).
