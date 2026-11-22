# 08 — Testing & Demo

## 1. Strategy

- **Unit tests** (pure functions): `utils/time`, `utils/paye`, `workdayService.countWorkingDays`, `assertTransition`.
- **Service tests** (with `MongoMemoryReplSet`): one or more per business rule. This is where most of the value is.
- **HTTP tests** (supertest) for access control only: right role → 200, wrong role → 403, logged out → redirect to `/login`.
- **Manual checklist** (below) run on Day 9 and again on the deployed site on Day 10.
- Freeze "now" in tests by injecting a clock (`services` take `now = new Date()` param) so late/closing-date/absence tests are deterministic.

## 2. Seed accounts (password `Passw0rd!`, change for production)

| Email | Roles | Notes |
|-------|-------|-------|
| admin@staffhub.test | admin | |
| hr@staffhub.test | hr, employee | payroll approver |
| recruiter@staffhub.test | recruiter, employee | |
| manager@staffhub.test | manager, employee | manages 5 staff in Sales |
| payroll@staffhub.test | payroll, employee | |
| assets@staffhub.test | asset, employee | |
| employee@staffhub.test | employee | reports to manager@ |

## 3. Rule test checklist

| Test | Scenario | Expected |
|------|----------|----------|
| T-A1 | Open `/employees` logged out | Redirect to `/login` |
| T-A2 | employee@ opens `/payroll` | 403 |
| T-A3 | employee@ opens own profile / another employee's | 200 / 403 |
| T-A4 | manager@ opens team member profile; then `/employees/:id/compensation` | Profile without salary/bank; 403 |
| T-A5 | payroll@ and hr@ open compensation | 200 |
| T-A6 | Approve a leave | AuditLog row with actor, action, before/after |
| T-A7 | Deactivate user while logged in, reload | Logged out, "Account deactivated" |
| T-R1 | Publish vacancy on pending/rejected requisition | Error; only approved requisitions selectable |
| T-R2 | Apply twice with `Jane@x.com` and ` jane@X.com ` | Second rejected: "You have already applied" |
| T-R3 | Apply at 00:00:01 Kampala the day after closing date | Rejected; vacancy hidden from `/careers` |
| T-R4 | Send offer in draft / pending_approval | Error |
| T-R5 | Convert accepted offer twice | First creates 1 Employee with application data; second errors |
| T-R6 | After conversion | User, Employee, Compensation, LeaveBalances, Checklist exist |
| T-L1 | Check in twice same day | Second rejected, single record |
| T-L2 | Check out before check-in; check out twice | Both rejected |
| T-L3 | Schedule 08:00, grace 15; check in 08:15 / 08:16 | present / late 1 min |
| T-L4 | Check in on Saturday or a holiday | Rejected |
| T-L5 | Run absence job for a date with: no record, approved leave, holiday, Saturday | absent / on_leave / holiday / day_off; re-run creates no duplicates |
| T-L6 | Correction without reason; manager of another team reviews; reject without reason | All rejected |
| T-L7 | Request leave overlapping pending and approved request | Rejected |
| T-L8 | Annual balance 3, request 4 working days | Rejected with available balance shown |
| T-L9 | Fri → Tue spanning a weekend + a holiday Monday | 2 working days |
| T-L10 | 3-day annual (≤ threshold) / 7-day annual / maternity | approved by manager / pending_hr / pending_hr |
| T-L11 | Approve | balance used += days, pending −= days; attendance `on_leave` rows created |
| T-P1 | Prepare payroll with month unlocked | Error |
| T-P2 | Preparer approves own run; employee views payslip before lock | Both blocked |
| T-P3 | Edit payslip in locked run; create adjustment without reason | Both rejected; approved adjustment appears in next run |
| T-S1 | Assign an assigned asset (also two concurrent requests) | Rejected; only one open assignment |
| T-S2 | Return as damaged | Assignment closed, asset `damaged`, audit row |
| T-S3 | Another employee acknowledges | 403 |
| T-X1 | Close exit case with an unreturned laptop / unpaid loan | Rejected |
| T-X2 | Run deactivation the day after last working day | user inactive, employee `exited` |
| T-X3 | Call `Employee.deleteOne` | Throws |
| T-G1 | Submit forms with missing required fields | Field errors, nothing saved |
| T-G2 | Manager approves own leave | Rejected |
| T-G3 | Any reject without reason | Rejected |
| T-G4 | Audit viewer filters by entity | Shows history |
| T-G5 | Check-in at 07:30 UTC | Displayed 10:30 EAT; amounts shown `UGX 1,250,000` |
| PAYE | 235,000 / 300,000 / 400,000 / 1,000,000 / 12,000,000 | 0 / 6,500 / 23,000 / 202,000 / 3,702,000 (3,502,000 + 200,000 surcharge) |

## 4. Demo script (~10 minutes)

1. **Public**: open `/careers` on phone width → apply → apply again with same email → blocked.
2. **manager@**: create requisition. **hr@**: approve with comment. **recruiter@**: publish vacancy (show it can't publish an unapproved one).
3. **recruiter@**: shortlist → interview → draft offer. **hr@**: approve offer → recruiter sends → record accepted → **hr@** converts → onboarding checklist appears.
4. **employee@**: check in (late badge) → check in again (blocked) → request leave overlapping (blocked) → valid request.
5. **manager@**: approve leave; open team member profile → no salary visible.
6. **payroll@**: lock month → prepare payroll → submit; try approving own run (blocked). **hr@**: approve → lock → **employee@** sees payslip.
7. **assets@**: assign laptop → try assigning to someone else (blocked) → employee acknowledges.
8. **hr@**: open exit case → try closing with laptop out (blocked) → return laptop, complete items → run deactivation → user can't log in; records still visible.
9. **hr@**: audit log showing the whole story.
