# 06 — 10-Day Schedule

**Start:** Sat 21 Nov 2026 · **Deadline:** Mon 30 Nov 2026 (Day 10)
Capacity: ~7 focused h/day ≈ **70 h**. Planned work ≈ **58 h** → **~12 h buffer** (≈17 %), held mostly on Days 9–10.

Principle: build in dependency order (auth → people → time → recruitment → money → exit), and **finish each day with something demoable, committed and seeded**. Business-rule tests are written *with* each module, not at the end.

## Overview

| Day | Date | Theme | Milestone at end of day |
|-----|------|-------|-------------------------|
| 1 | Sat 21 Nov | Foundation | Login works for 7 seeded roles; role-based nav; audit + time/money helpers |
| 2 | Sun 22 Nov | Employees & privacy | HR creates employees; managers can't see salary; change requests |
| 3 | Mon 23 Nov | Attendance | Check-in/out, late calc, team view, corrections |
| 4 | Tue 24 Nov | Leave | Full leave flow with working days, overlap/balance checks, absence job |
| 5 | Wed 25 Nov | Recruitment I | Requisition → approval → vacancy → public apply |
| 6 | Thu 26 Nov | Recruitment II + hiring | Pipeline, interview, offer approval, conversion + onboarding |
| — | | **★ Checkpoint (end of Day 6)** | All "people & time" flows done. If behind, apply cut list now |
| 7 | Fri 27 Nov | Payroll | Lock month → prepare → approve → lock → payslips; adjustments |
| 8 | Sat 28 Nov | Assets + Offboarding + Audit | Asset lifecycle, exit clearance, deactivation job, audit viewer |
| 9 | Sun 29 Nov | Hardening | Full rule test pass, dashboards, UI polish, demo seed data |
| 10 | Mon 30 Nov | Ship | Deploy, README, demo rehearsal, submit by early afternoon |

## Daily detail

### Day 1 — Foundation (7 h)
Scaffold, DB connect, sessions, User model, login/logout, `requireAuth`/`requireRole`, layout + nav + CSS, flash, error pages, `utils/time.js`, `utils/money.js`, `auditService`, state-machine helper, seed script with 1 user per role, test harness.
**Done when:** each seeded user logs in and sees only their menu; `npm test` runs.

### Day 2 — Employees & privacy (7 h)
Department, WorkSchedule, Employee, Compensation models; HR CRUD; profile tabs; per-role projections; self-edit contact fields; ProfileChangeRequest flow; admin users/roles page.
**Done when:** T-A3/A4/A5 pass — manager viewing a team member gets no compensation tab and a 403 on the URL.

### Day 3 — Attendance (6 h)
Attendance model + unique index, `workdayService`, check-in/out on dashboard, late calc, my attendance, team view, corrections + manager review, Holiday model + seed.
**Done when:** T-L1…L4, T-L6 pass.

### Day 4 — Leave (7 h)
LeaveType/LeaveBalance/LeaveRequest, working-day preview, submit with overlap + balance checks, manager → HR approval, balance + attendance updates, cancel, `markAbsences` job + admin trigger.
**Done when:** T-L5, T-L7…L11 pass.

### Day 5 — Recruitment I (6 h)
Requisition (manager) + HR review, Vacancy create/publish/close (approved requisitions only), public `/careers` pages, apply with duplicate + closing-date checks, application list.
**Done when:** T-R1…R3 pass; apply works logged-out on a phone-width screen.

### Day 6 — Recruitment II + Hiring (7 h)
Pipeline board + status moves, interview scheduling (simple), Offer lifecycle with approval, record candidate response, `convertOffer` transaction (User + Employee + Compensation + balances + checklist), onboarding checklist page with role-assigned tasks.
**Done when:** T-R4…R6 pass; a candidate goes from application to logged-in employee in the demo.

**★ Checkpoint:** compare against the plan. If more than ~4 h behind, apply the cut list (below) before starting payroll.

### Day 7 — Payroll (7 h)
AttendanceMonth lock + summary, Settings (PAYE/NSSF), `paye.js` with unit tests, PayrollRun prepare/recalculate, submit/approve (four-eyes)/lock, payslip publish + printable payslip, PayrollAdjustment, Loan (simple), payment CSV.
**Done when:** T-P1…P3 pass; employee sees their payslip only after lock.

### Day 8 — Assets, Offboarding, Audit (7 h)
Asset + AssetAssignment (partial unique index), assign/acknowledge/return/report damaged-lost, history. ExitCase + clearance template + auto-checks, close guard, `deactivateLeavers` job, delete guards. Audit log viewer + filters.
**Done when:** T-S1…S3, T-X1…X3, T-G4 pass.

### Day 9 — Hardening (6 h + buffer)
Run full checklist in 08; fix bugs; role dashboards with counts; validation messages; mobile layout check; rich demo seed (≈15 employees, 1 month attendance, leaves, a vacancy with applicants, a locked payroll). P1 reports if time.
**Done when:** every row in 04-business-rules.md has a passing test or a manual-test tick.

### Day 10 — Ship (4 h + buffer)
Deploy to Render + Atlas, set env vars, seed prod, smoke test each role, finish README (setup, demo accounts, rule→test map), record/rehearse demo, submit.
**Rule:** feature freeze at end of Day 9. Day 10 is only fixes, deploy, docs.

## Cut list (apply top-down if behind)

1. Performance reviews (P2) — already excluded.
2. Reports page → keep dashboard counters only.
3. Interviews → a single `interviewAt` + `notes` on Application instead of a separate model.
4. Notifications bell → flash messages only.
5. Loans → a manual "loan settled" clearance checkbox + manual deduction field on payslip.
6. Payment CSV → print the payroll table.
7. Profile change requests → HR edits legal name/bank directly with mandatory reason (still audited).

**Never cut:** anything in 04-business-rules.md, the audit log, RBAC/privacy, deploy/README.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Time-zone bugs around midnight | High | `workDate` string key; all date math through `utils/time.js`; tests at 23:50 and 00:10 Kampala |
| Payroll math rabbit hole | Medium | PAYE bands in settings; pure function with 5 unit tests; timebox Day 7 |
| Mongo transactions need a replica set | Medium | Atlas supports them; in tests use `MongoMemoryReplSet` |
| Scope creep (performance, emails, PDFs) | High | P2 list; feature freeze end of Day 9 |
| Render cold start/env issues on deadline day | Medium | Do a throwaway deploy on Day 5 evening (30 min) |
| Losing work | Low | Commit at end of each module; push to private remote (when you choose) |
