# 05 — Screens & Routes

Mockups for the starred (★) screens are in [../mockups/staffhub-mockup.html](../mockups/staffhub-mockup.html).
POST/PATCH routes always redirect back with a flash message (PRG pattern). Forms use `method-override` for PATCH.

## Public

| Route | Screen | Notes |
|-------|--------|-------|
| `GET /login` ★ | Login | rate-limited POST |
| `GET /careers` | Open vacancies | only `published` and not past closing date |
| `GET /careers/:slug` ★ | Vacancy detail + apply form | |
| `POST /careers/:slug/apply` | | BR-R2, BR-R3 |

## Everyone signed in

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /` ★ | Role-aware dashboard (widgets per role) | all |
| `GET /me` | My profile (+ edit permitted contact fields) | employee |
| `POST /me/change-requests` | Request legal name / bank change | employee |
| `GET /me/payslips`, `/me/payslips/:id` | Payslip list / printable payslip | employee |
| `GET /me/assets` | My assets + Acknowledge button | employee |
| `GET /notifications` | Notifications | all |
| `POST /logout` | | all |

## Attendance

| Route | Screen | Roles |
|-------|--------|-------|
| `POST /attendance/check-in`, `/check-out` | buttons on dashboard ★ | employee |
| `GET /attendance/me` | My month calendar/table | employee |
| `POST /attendance/corrections` | Correction request form | employee |
| `GET /attendance/team` | Team daily/monthly view | manager |
| `GET /approvals` ★ | Unified approvals inbox (leave, corrections, requisitions, offers, change requests, payroll) filtered by role | manager, hr |
| `POST /attendance/corrections/:id/review` | | manager |
| `GET /attendance/months` · `POST /attendance/months/:y/:m/lock` | Lock month & view summary | payroll, hr |

## Leave

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /leave` | My requests + balances | employee |
| `GET /leave/new` ★ | Request form (live working-day count via `GET /leave/preview?start&end&type`) | employee |
| `POST /leave` · `POST /leave/:id/cancel` | | employee |
| `POST /leave/:id/review` | approve/reject (+reason) | manager, hr |
| `GET /leave/calendar` | Team/org leave calendar | manager, hr |

## Employees (HR)

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /employees` ★ | List + search/filter (dept, status) | hr, payroll (R), manager (team only) |
| `GET /employees/new` · `POST /employees` | Create employee (direct, e.g. existing staff) | hr |
| `GET /employees/:id` ★ | Profile tabs: Overview · Job · Compensation (restricted) · Attendance · Leave · Assets · History | per matrix |
| `PATCH /employees/:id` | Edit | hr |
| `PATCH /employees/:id/compensation` | Edit salary/bank | hr |
| `GET /change-requests` · `POST /change-requests/:id/review` | | hr |

## Recruitment

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /requisitions` · `/new` · `POST` | Requisition list/form | manager create; hr, recruiter view |
| `POST /requisitions/:id/review` | approve/reject | hr |
| `GET /vacancies` · `/new` · `POST` · `POST /:id/publish` · `/:id/close` | | recruiter |
| `GET /vacancies/:id/pipeline` ★ | Kanban: Submitted → Shortlisted → Interview → Offered → Hired/Rejected | recruiter, hr |
| `POST /applications/:id/status` | move stage (+reason on reject) | recruiter |
| `POST /applications/:id/interviews` | schedule interview | recruiter |
| `POST /applications/:id/offer` | draft offer | recruiter |
| `POST /offers/:id/submit` · `/review` · `/send` · `/respond` | offer lifecycle (respond = recruiter records candidate's answer) | recruiter / hr |
| `POST /offers/:id/convert` | Convert to employee | hr |
| `GET /onboarding` · `/onboarding/:id` · `POST /onboarding/:id/tasks/:taskId/done` | Checklists | hr, manager, employee, asset (own tasks) |

## Payroll

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /payroll` | Runs list | payroll, hr |
| `POST /payroll` | Prepare run (year, month) | payroll |
| `GET /payroll/:id` ★ | Run detail: stepper + payslip table + totals | payroll, hr |
| `POST /payroll/:id/recalculate` | only in draft | payroll |
| `POST /payroll/:id/submit` · `/approve` · `/reject` · `/lock` | | payroll / hr |
| `GET /payroll/:id/report.csv` | Bank/payment report | payroll |
| `GET /payroll/adjustments` · `POST` · `POST /:id/approve` | Adjustments | payroll create, hr approve |
| `GET /loans` · `POST /loans` | Simple loans | payroll |

## Assets

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /assets` ★ | Register with status filter | asset, hr (R) |
| `GET /assets/new` · `POST /assets` | | asset |
| `GET /assets/:id` | Detail + assignment history | asset |
| `POST /assets/:id/assign` · `/return` · `/report` (damaged/lost) | | asset |
| `POST /assets/assignments/:id/acknowledge` | | employee (assignee) |

## Offboarding

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /exits` · `POST /exits` | Open exit case | hr |
| `GET /exits/:id` ★ | Clearance checklist (auto items show live status) | hr, manager, asset, payroll, employee (own) |
| `POST /exits/:id/items/:key/done` | complete clearance item | owner role |
| `POST /exits/:id/close` | blocked until all cleared | hr |

## Admin & audit

| Route | Screen | Roles |
|-------|--------|-------|
| `GET /admin/users` · `POST` · `PATCH /:id/roles` · `/:id/deactivate` | User management | admin |
| `GET /admin/settings` · `PATCH` | Grace, thresholds, PAYE, templates, leave types, holidays, schedules | admin |
| `POST /admin/jobs/mark-absences` · `/deactivate-leavers` | Manual job triggers | admin |
| `GET /audit` | Audit log with filters | admin, hr |
| `GET /reports` | Headcount, leave usage, attendance, payroll summary (P1) | hr |
