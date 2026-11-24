# 07 — Task Breakdown

Format: `ID · task · estimate · depends on` then **AC** (acceptance criteria). Tick boxes as you go.
Estimates in hours. Rule IDs (BR-…) link to [04-business-rules.md](04-business-rules.md).

| Epic | Day | Tasks | Est. |
|------|-----|-------|------|
| E1 Foundation | 1 | F-01…F-10 | 7.0 |
| E2 Employees & privacy | 2 | E-01…E-08 | 7.0 |
| E3 Attendance | 3 | A-01…A-07 | 6.0 |
| E4 Leave | 4 | L-01…L-08 | 7.0 |
| E5 Recruitment | 5–6 | R-01…R-12 | 12.5 |
| E6 Payroll | 7 | P-01…P-09 | 7.0 |
| E7 Assets | 8 | S-01…S-04 | 3.0 |
| E8 Offboarding & audit | 8 | X-01…X-05 | 4.0 |
| E9 Hardening & ship | 9–10 | H-01…H-08 | 7.5 |
| **Total** | | | **≈ 61 h** (+ ~9 h buffer) |

---

## E1 — Foundation (Day 1)

- [x] **F-01** · Scaffold project: `npm init`, ESM, deps, folder structure, `.env.example`, `.gitignore`, `git init` · 0.5
  **AC:** `npm run dev` serves "Hello StaffHub"; `.env` ignored.
- [x] **F-02** · `config/db.js`, `config/session.js` (connect-mongo), helmet, csrf, flash, method-override · 0.75 · F-01
- [x] **F-03** · `User` model + bcrypt helpers · 0.5 · F-02
- [x] **F-04** · Login/logout routes + views, login rate limit, `isActive` check · 1 · F-03 · BR-A1, BR-A7
  **AC:** wrong password → generic error; inactive user → "Account deactivated".
- [x] **F-05** · `requireAuth`, `requireRole`, `res.locals.user`, 403/404/500 pages, `ValidationError`/`ForbiddenError` + error middleware · 0.75 · F-04 · BR-A2
- [x] **F-06** · Layout: sidebar nav built from roles, top bar, flash area, `app.css` (mobile-first) · 1.25 · F-05
- [x] **F-07** · `utils/time.js` (`nowKampala`, `todayKey`, `toKampala`, `fmt`), `utils/money.js` (`fmtUGX`) + unit tests · 0.5 · BR-G5
- [x] **F-08** · `AuditLog` model + `auditService.log` (masking) + `assertTransition` helper + tests · 0.5 · BR-G4
- [x] **F-09** · `seed/seed.js`: 1 user per role (+ password `Passw0rd!`), idempotent · 0.5 · F-03
- [x] **F-10** · Test harness: `node:test`, supertest, `MongoMemoryReplSet`, `npm test` · 0.75 · F-02
  **AC (Day 1):** each seeded user logs in and only sees their menu items.

## E2 — Employees & privacy (Day 2)

- [ ] **E-01** · Models: Department, WorkSchedule, Employee (auto `employeeNo`), Compensation · 1 · F-*
- [ ] **E-02** · `employeeService` with per-role projections + team scoping · 1 · E-01 · BR-A3, BR-A4
- [ ] **E-03** · `compensationService.getFor/update` (hr, payroll, self only) + audit · 0.75 · E-01 · BR-A5
- [ ] **E-04** · HR: employee list (search/filter), create, edit (+ create linked User) · 1.5 · E-02
- [ ] **E-05** · Profile page with tabs; Compensation tab rendered only if allowed · 1 · E-03
  **AC:** manager hitting `/employees/:id/compensation` gets 403; employee sees own salary.
- [ ] **E-06** · `/me`: edit permitted contact fields only (whitelist) · 0.5 · E-02
- [ ] **E-07** · ProfileChangeRequest: submit (employee) → review (HR, reason on reject) → apply + audit · 1 · E-06 · BR-G3
- [ ] **E-08** · Admin users page: create user, assign roles, deactivate (audit) · 0.5 · F-05

## E3 — Attendance (Day 3)

- [ ] **A-01** · Holiday model + seed Uganda 2026 holidays; `workdayService.isWorkingDay`, `countWorkingDays` + tests · 1 · E-01 · BR-L9
- [ ] **A-02** · Attendance model, unique `{employee, workDate}` · 0.25 · E-01 · BR-L1
- [ ] **A-03** · `checkIn` (working day check, late calc) / `checkOut` (after check-in) + tests · 1.25 · A-01, A-02 · BR-L1–L4
  **AC:** second check-in same day → "Already checked in at 08:07"; checkout without check-in → error.
- [ ] **A-04** · Dashboard check-in widget (status, time, late badge) · 0.75 · A-03
- [ ] **A-05** · My attendance (month table) + team attendance (manager, by date) · 1 · A-03
- [ ] **A-06** · Corrections: request (reason required) → manager review → updates record (`source: correction`) + audit; blocked if month locked · 1.25 · A-05 · BR-L6
- [ ] **A-07** · Unified `/approvals` inbox skeleton (corrections first; other types plug in later) · 0.5 · A-06

## E4 — Leave (Day 4)

- [ ] **L-01** · LeaveType, LeaveBalance, LeaveRequest models + seed types; create balances for existing employees · 0.75 · E-01
- [ ] **L-02** · `leaveService.preview` + `GET /leave/preview` (JSON working days + available balance) · 0.5 · A-01, L-01 · BR-L9
- [ ] **L-03** · `submit`: validate dates, compute days, overlap check, balance check, `pending += days`, set `needsHr` · 1.25 · L-02 · BR-L7, BR-L8
- [ ] **L-04** · Leave request form with live preview + my requests/balances page + cancel (release pending) · 1 · L-03
- [ ] **L-05** · `review`: manager stage (own team, not self) → HR stage when needed; reason on reject; audit · 1.25 · L-03 · BR-L10, BR-G2, BR-G3
- [ ] **L-06** · On final approval: pending→used, upsert `on_leave` attendance for each working day · 0.75 · L-05 · BR-L11
- [ ] **L-07** · `markAbsences(date)` job (idempotent) + cron + admin trigger + tests · 1 · L-06, A-03 · BR-L5
- [ ] **L-08** · Leave items in `/approvals`; leave calendar (simple list by date) · 0.5 · L-05

## E5 — Recruitment & hiring (Days 5–6)

- [ ] **R-01** · Requisition model + manager form + list · 1 · E-01
- [ ] **R-02** · HR review requisition (approve/reject + reason, audit), in `/approvals` · 0.75 · R-01 · BR-R1
- [ ] **R-03** · Vacancy model + recruiter create (approved requisitions only) / publish / close · 1.25 · R-02 · BR-R1
- [ ] **R-04** · Public `/careers` list + detail (no auth, mobile-friendly) · 1 · R-03
- [ ] **R-05** · Apply: validation, email normalisation, unique index, closing-date check, thank-you page + tests · 1.25 · R-04 · BR-R2, BR-R3
- [ ] **R-06** · Applications list + pipeline board per vacancy, stage moves (reason on reject) · 1.5 · R-05
- [ ] **R-07** · Interview scheduling (date/time Kampala, mode, panel, outcome) · 0.75 · R-06
- [ ] **R-08** · Offer model + draft form (prefilled from application/requisition) · 0.75 · R-06
- [ ] **R-09** · Offer submit → HR approve/reject → send (only if approved) → record accept/decline + tests · 1.25 · R-08 · BR-R4
- [ ] **R-10** · `hiringService.convertOffer` transaction: User + Employee (copied data) + Compensation + LeaveBalances + Checklist; guard double conversion + tests · 1.5 · R-09, L-01 · BR-R5, BR-R6
- [ ] **R-11** · Onboarding checklist page; tasks per role (HR docs, manager intro, employee details, asset officer issue laptop); mark done · 1 · R-10
- [ ] **R-12** · Day-5 evening: throwaway deploy to Render to de-risk Day 10 · 0.5

## E6 — Payroll (Day 7)

- [ ] **P-01** · Settings model + admin settings page (grace, thresholds, PAYE bands, NSSF rates) · 0.75 · F-*
- [ ] **P-02** · `utils/paye.js` pure function + 5 unit tests (each band edge) · 0.5 · P-01
- [ ] **P-03** · AttendanceMonth: build summary from Attendance + lock (payroll/hr), blocks corrections after lock · 1 · L-07 · BR-P1
- [ ] **P-04** · PayrollRun + Payslip models, locked-edit hooks · 0.5 · P-03 · BR-P3
- [ ] **P-05** · `prepare(year, month)`: requires locked month; per active employee compute gross, unpaid/absence deduction, PAYE, NSSF, loan, pending approved adjustments, net · 1.5 · P-02, P-04 · BR-P1
- [ ] **P-06** · Run page: stepper, table, totals, recalc (draft only), submit, approve/reject (hr, ≠ preparer), lock → publish payslips · 1 · P-05 · BR-P2
- [ ] **P-07** · Employee payslip list + printable payslip view (own only) · 0.5 · P-06 · BR-A3
- [ ] **P-08** · PayrollAdjustment (reason, HR approval, applied in next run) + Loan (simple) · 0.75 · P-06 · BR-P3
- [ ] **P-09** · Payment report CSV · 0.5 · P-06

## E7 — Assets (Day 8)

- [ ] **S-01** · Asset + AssetAssignment models, partial unique index, register list/create · 0.75
- [ ] **S-02** · Assign (atomic available→assigned), return (condition), report damaged/lost + audit + tests · 1.25 · S-01 · BR-S1, BR-S2
- [ ] **S-03** · Employee "My assets" + acknowledge · 0.5 · S-02 · BR-S3
- [ ] **S-04** · Asset detail with assignment history; link onboarding "issue laptop" task to assign · 0.5 · S-02, R-11

## E8 — Offboarding & audit (Day 8)

- [ ] **X-01** · ExitCase model + HR open form (sets `lastWorkingDay`, employee `exiting`) · 0.75
- [ ] **X-02** · Clearance page: items per owner role; auto-checks for assets (no open assignments) and loans (balance 0); mark done · 1.25 · X-01, S-02, P-08 · BR-X1
- [ ] **X-03** · Close guard + `deactivateLeavers` job + cron + admin trigger + tests · 0.75 · X-02 · BR-X2
- [ ] **X-04** · Delete guards on protected models + test · 0.25 · BR-X3
- [ ] **X-05** · Audit log viewer (filters: entity, actor, date) · 1 · F-08 · BR-G4

## E9 — Hardening & ship (Days 9–10)

- [ ] **H-01** · Role dashboards with counters (pending approvals, today's attendance, open vacancies, assets out) · 1
- [ ] **H-02** · Run the full checklist in 08; fix failures · 2
- [ ] **H-03** · Validation/UX pass: required markers, error messages, empty states, mobile width check · 1
- [ ] **H-04** · Rich demo seed (15 employees, 1 month attendance, leave in all states, vacancy + applicants, locked payroll, assets, an exit case) · 1
- [ ] **H-05** · *(P1)* Reports page · 0.5
- [ ] **H-06** · Deploy Render + Atlas, env vars, seed, smoke test each role · 1
- [ ] **H-07** · README: setup, demo accounts, rule→test map, screenshots · 0.5
- [ ] **H-08** · Demo rehearsal (script in 08) + submit · 0.5

---

## Dependency spine

```
F (auth, helpers) ─► E (employees) ─► A (attendance) ─► L (leave) ─► P (payroll)
                           │                                 ▲
                           └─► R (recruitment) ─► R-10 convert┘ (needs leave balances)
                                                     │
                           S (assets) ◄──────────────┘ onboarding task
                           X (offboarding) needs S + P-08 (loans)
```

## Team split

If you have teammates, split after Day 1 (foundation must be done by one person first):

| Person | Epics |
|--------|-------|
| A | E2 Employees → E3 Attendance → E4 Leave |
| B | E5 Recruitment & hiring → E7 Assets |
| C | E6 Payroll → E8 Offboarding & audit |
| All | E9 on Days 9–10 |

With 3 people, aim to finish features by Day 7 and use Days 8–10 for integration, testing and polish.
