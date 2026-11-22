# 02 — Architecture

## 1. Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Runtime | Node.js 20, ES modules | Same as course project |
| Web | Express 4 | Familiar, fast to build |
| Views | EJS + `express-ejs-layouts` + one CSS file | Server-rendered = less code, works on phone/tablet |
| DB | MongoDB Atlas + Mongoose 8 | Same as course project; unique indexes enforce several rules |
| Sessions | `express-session` + `connect-mongo` | Simple cookie auth, survives restarts |
| Passwords | `bcrypt` (cost 12) | Standard |
| Validation | `express-validator` | Declarative per route |
| Time | `dayjs` + `utc` + `timezone` plugins | Kampala conversions |
| Jobs | `node-cron` (timezone `Africa/Kampala`) | Absence marking, deactivation |
| Security | `helmet`, `express-rate-limit` (login), `csrf-sync`, `method-override` | Basic hardening |
| Tests | `node:test` + `supertest` + `mongodb-memory-server` | Rule tests without Atlas |
| Deploy | Render web service + Atlas free tier | Free, quick |

## 2. Folder structure

```
staffhub/
├─ server.js                 # start-up: env check → DB → listen (+ cron start later)
├─ app.js                    # createApp(): middleware + routes (imported by tests)
├─ config/ env.js db.js session.js roles.js nav.js  (settings.js with P-01)
├─ models/                   # one file per collection (see 03-data-model.md)
├─ services/                 # ALL business rules live here, not in routes
│  ├─ attendanceService.js   leaveService.js   payrollService.js
│  ├─ recruitmentService.js  hiringService.js  assetService.js
│  ├─ offboardingService.js  auditService.js   workdayService.js
├─ middleware/ auth.js (requireAuth, requireRole) · locals.js · errors.js
├─ routes/                   # thin: validate → call service → render/redirect
│  ├─ auth.js admin.js employees.js attendance.js leave.js
│  ├─ recruitment.js careers.js (public) payroll.js assets.js offboarding.js audit.js
├─ views/ layouts/ partials/ <module>/*.ejs
├─ public/ css/app.css  js/app.js
├─ jobs/ markAbsences.js  deactivateLeavers.js
├─ utils/ time.js (Kampala helpers) · money.js (UGX) · paye.js
├─ seed/ seed.js
└─ tests/ *.test.js
```

**Rule:** routes never touch business logic directly. Every rule in [04-business-rules.md](04-business-rules.md) maps to a service function, so it is testable without HTTP.

## 3. Auth & RBAC

- `User { email, passwordHash, roles[], employee (ref), isActive }`.
- `requireAuth` — session must exist **and** `user.isActive` (re-checked each request, so deactivation takes effect immediately).
- `requireRole(...roles)` — 403 page if no overlap.
- **Ownership checks inside services**, not just role checks: e.g. manager can approve leave only if `request.employee.manager == me`; employee can view only `payslip.employee == me`.
- Nav menu built from roles in `res.locals.user`.

### Permission matrix (✔ full · T team only · S self only · R read)

| Area | admin | hr | recruiter | manager | payroll | asset | employee |
|------|:----:|:--:|:---------:|:-------:|:-------:|:-----:|:--------:|
| Users & roles | ✔ | | | | | | |
| Settings | ✔ | R | | | R | | |
| Employee profile (non-sensitive) | R | ✔ | | T (R) | R | R (name/dept) | S |
| Salary / bank / national ID | | ✔ | | ✗ | ✔ | | S (R) |
| Profile change request | | approve | | | | | S create |
| Attendance | | R | | T + approve corrections | R + lock month | | S check-in/out, request correction |
| Leave | | ✔ approve (HR stage) | | T approve | R | | S request/cancel |
| Requisitions | | approve | R | create | | | |
| Vacancies / applications / interviews | | R | ✔ | R own vacancies | | | |
| Offers | | approve, convert | create | | | | |
| Payroll | | approve | | | prepare, adjust | | S payslips |
| Assets | | R | | | | ✔ | S acknowledge |
| Exit cases | | ✔ | | T handover task | loan clearance | asset clearance | S own tasks |
| Audit log | ✔ | ✔ | | | | | |

## 4. Privacy design

- **Sensitive data in its own collection:** `Compensation { employee, basicSalary, allowances, bankName, accountNo, nin, tin, nssfNo }`. Only `compensationService.getFor(user, employeeId)` reads it, and it checks `hr | payroll | self`. Managers literally cannot load it — no "forgot to hide a field" bugs.
- Employee views use per-role projections (`EMPLOYEE_FIELDS_FOR.manager = 'name dept jobTitle phone workEmail schedule'`).
- Passwords never logged; audit `before/after` snapshots strip `passwordHash` and mask account numbers (`****1234`).

## 5. Time & money

- **Store** all instants as UTC `Date`. **Display** with `fmtKampala(date)`.
- **Working-day key:** `workDate: "YYYY-MM-DD"` string computed in Kampala (`dayjs().tz('Africa/Kampala').format('YYYY-MM-DD')`). Used for the unique attendance index, avoiding midnight-UTC bugs.
- `workdayService.countWorkingDays(employee, from, to)` excludes non-schedule days and `Holiday` dates — used by leave, absence job and payroll.
- **Money as integer UGX** (UGX has no subunit in practice). `fmtUGX(n)` → `UGX 1,250,000`. Round each deduction with `Math.round`.

## 6. Audit & history

`auditService.log({ actor, action, entity, entityId, before, after, reason })` called from services on: create/update of official records, every approve/reject, role changes, payroll lock, asset issue/return, deactivation. Rejections and corrections **require** `reason` (validated in service → throws `ValidationError`).

## 7. Status machines (enforced in services)

```
Requisition:  draft → submitted → approved | rejected
Vacancy:      draft → published → closed
Application:  submitted → shortlisted → interview → offered → hired | rejected | withdrawn
Offer:        draft → pending_approval → approved → sent → accepted | declined | (rejected)
Leave:        pending_manager → pending_hr → approved | rejected | cancelled
Correction:   pending → approved | rejected
AttendanceMonth: open → locked
PayrollRun:   draft → submitted → approved → locked (payslips published) ; adjustments only after locked
Asset:        available → assigned → available | damaged | lost | retired
ExitCase:     open → clearance_in_progress → cleared → closed
```

A helper `assertTransition(machine, from, to)` throws on illegal moves — one place to test.

## 8. Background jobs

| Job | Schedule (Kampala) | Manual trigger |
|-----|-------------------|----------------|
| `markAbsences(date)` | 23:55 daily | Admin → Settings → "Run absence marking for date" |
| `deactivateLeavers(today)` | 00:10 daily | Admin → "Run deactivation now" |

Both idempotent (safe to re-run).

## 9. Error handling & security

- Central error middleware: `ValidationError` → flash + redirect back; `ForbiddenError` → 403 page; others → 500 page + console log.
- Flash messages via `connect-flash`.
- Helmet, CSRF token on every form, login rate limit (5/min/IP), `httpOnly` + `sameSite=lax` cookies, `secure` in production.
- `.env` gitignored, `.env.example` committed: `MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV`, `PORT`.
