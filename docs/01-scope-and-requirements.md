# 01 — Scope & Requirements

## 1. Goal

Deliver a working, demoable StaffHub in 10 days that enforces **every business rule in the brief**. Breadth across all 8 processes matters more than polish in any single one. Each module ships as a "thin but correct" vertical slice: model → rules → routes → EJS page → audit entry → test.

## 2. Roles

One user account can hold **several roles** (`roles: []`) — a Line Manager is also an Employee, an HR Manager may also be the payroll approver.

| Role key | Role | Core responsibilities |
|----------|------|-----------------------|
| `admin` | System Administrator | Users, role assignment, system settings (grace period, leave types, holidays, PAYE bands) |
| `hr` | HR Manager | Employee records, approve requisitions/offers/profile changes, HR-level leave approval, exits, reports, payroll approval* |
| `recruiter` | Recruiter | Publish vacancies, manage applications, interviews, draft offers |
| `manager` | Line Manager | Request positions, approve team leave & corrections, view team attendance, performance reviews |
| `payroll` | Payroll Officer | Lock attendance month, prepare payroll, adjustments, payslips, payment report |
| `asset` | Asset Officer | Asset register, issue/return/damage/loss, asset clearance |
| `employee` | Employee | Own profile, check-in/out, leave, payslips, acknowledge assets |
| *(public)* | Job Applicant | Browse vacancies, apply — **no account** |

\* "Authorised approver" for payroll = any user with `hr` role **who did not prepare the run** (four-eyes rule). Configurable in settings.

## 3. Modules & priority

**P0 = must ship (graded core)**, **P1 = ship if on schedule**, **P2 = stretch / cut first**.

| Module | P0 | P1 | P2 |
|--------|----|----|----|
| Auth & access | Login/logout, sessions, RBAC middleware, role-filtered nav, password hashing, deactivated users blocked | Change password, login rate limit | Password reset by email |
| Admin | Create users, assign roles, deactivate | Settings page (grace period, PAYE bands, leave types, holidays) | — |
| Employee records | Create/edit employee, departments, manager link, work schedule, restricted compensation | Profile change requests (legal name, bank) with HR approval | Document uploads |
| Attendance | Check-in/out, one record/day, late calc, team view, correction requests + approval | Daily absence marking job + manual trigger | Attendance CSV export |
| Leave | Types, balances, request (working days, overlap, balance checks), manager → HR approval, balance & attendance update | Holiday calendar | Leave carry-over |
| Recruitment | Requisition → HR approval → vacancy → public apply (duplicate + closing date) → shortlist → offer → approval → accept | Interview scheduling | Email notifications |
| Hiring & onboarding | Convert accepted offer → employee + user + checklist (no re-entry) | Tasks auto-assigned to HR/manager/employee/asset officer | — |
| Payroll | Lock attendance month, prepare run, approve, lock, publish payslips, adjustments | Payment report CSV | Payslip PDF (use print-friendly HTML instead) |
| Assets | Register, assign (one holder), acknowledge, return/damaged/lost, history | — | QR labels |
| Offboarding | Exit case, clearance (assets, handover, loan), deactivate after last day, no hard delete | — | Exit interview form |
| Audit & history | Audit log for approvals/changes with reason | Audit log viewer (HR/admin) | Field-level diffs UI |
| Performance | — | — | Simple review cycle (manager rating + comments) |
| Reports/dashboard | Role dashboards with counts | Headcount, leave, attendance, payroll summary | Charts |

## 4. Assumptions (decisions taken so the plan can proceed)

Change any of these early — they affect the data model.

1. **Stack** matches the course's `stockflow` project: Express + EJS + Mongoose + Atlas. Server-rendered, no SPA.
2. **Work week:** Mon–Fri default, schedule per employee (`WorkSchedule`: days, start 08:00, end 17:00, grace 15 min).
3. **Leave balances:** yearly allocation per type (e.g. Annual 21 working days, Sick 30, Maternity 60, Paternity 4, Unpaid ∞). No carry-over in MVP.
4. **HR approval required** when the leave type has `requiresHrApproval` (Maternity, Unpaid) **or** the request exceeds `hrApprovalThresholdDays` (default 5).
5. **Payroll:** monthly. Gross = basic + fixed allowances. Deductions: PAYE (Uganda resident bands, stored in settings), NSSF employee 5 % (employer 10 % shown on report), unpaid leave and unexcused absence (basic ÷ working days in month × days), loan instalments. **Rates must be verified against current URA/NSSF rules before submission** — they live in settings, not code.
6. **Absence marking:** a cron job at 23:55 Kampala marks absentees for that day; an admin button can run it for any date (needed for the demo).
7. **Account deactivation:** cron job at 00:10 Kampala deactivates users whose `lastWorkingDay` is before today.
8. **Applicant identity** = vacancy + lowercase-trimmed email.
9. **Closing date** is inclusive until 23:59:59 Kampala time on that date.
10. **Solo developer, ~7 focused hours/day.** With 2–3 people, split by epic (see [07-tasks.md](07-tasks.md#team-split)).

## 5. Open questions (ask the lecturer/client on Day 1)

- Is performance management graded? (Currently P2.)
- Must payslips be PDFs, or is a printable page acceptable?
- Are real PAYE/NSSF figures expected, or is a flat placeholder fine?
- Is deployment required, or is a local demo enough?
- Does "loan settlement" need a loans module, or just a clearance checkbox with amount? (Plan: simple `Loan` record + clearance item.)

## 6. Out of scope

Biometrics, GPS, mobile native apps, real bank/mobile-money payment integration, email/SMS delivery (logged to console/notifications table instead), multi-company tenancy.
