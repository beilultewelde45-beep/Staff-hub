# 04 — Business Rules → Enforcement → Test

Every rule in the brief, mapped to where it is enforced and the test that proves it. **Use this as the grading checklist.** Test IDs refer to [08-testing-and-demo.md](08-testing-and-demo.md).

Legend: **DB** = index/schema constraint · **SVC** = service function · **MW** = middleware · **JOB** = cron job · **VIEW** = UI only (never the sole guard).

## Access & privacy

| ID | Rule | Enforcement | Test |
|----|------|-------------|------|
| BR-A1 | Every user must sign in | MW `requireAuth` on all routes except `/login`, `/careers/*` | T-A1 |
| BR-A2 | Users only see/change what their role allows | MW `requireRole` + SVC ownership checks | T-A2 |
| BR-A3 | Employees see own private info | SVC `employeeService.getProfile(viewer, id)` | T-A3 |
| BR-A4 | Managers see team's permitted info, **not salary or bank** | Separate `Compensation` collection; SVC `compensationService.getFor` denies manager; per-role projection | T-A4 |
| BR-A5 | Salary/bank/ID restricted to HR, Payroll, self | SVC `compensationService.getFor` | T-A5 |
| BR-A6 | No password sharing; important actions recorded | Sessions per user, bcrypt; SVC `auditService.log` on all approvals/changes | T-A6 |
| BR-A7 | Deactivated users cannot sign in | MW checks `isActive` on login **and** every request | T-A7 |

## Recruitment & hiring

| ID | Rule | Enforcement | Test |
|----|------|-------------|------|
| BR-R1 | Vacancy advertised only after HR approves requisition | SVC `recruitmentService.publishVacancy` requires `requisition.status === 'approved'`; vacancy create form only lists approved requisitions | T-R1 |
| BR-R2 | No duplicate application to same vacancy with same email | **DB** unique `{vacancy, email}` (email lowercased/trimmed) + friendly message on E11000 | T-R2 |
| BR-R3 | No applications after closing date | SVC `applyToVacancy` compares now (Kampala) with `closingDate 23:59:59`; vacancy must be `published`; careers page hides closed | T-R3 |
| BR-R4 | Offer approved before sent | SVC `sendOffer` requires `approved`; state machine | T-R4 |
| BR-R5 | Accepted offer → exactly one employee record, no re-entry | SVC `hiringService.convertOffer` in a transaction: requires `accepted` + `offer.employee == null`; copies name/email/phone from Application; sets `offer.employee`, `employee.sourceApplication` | T-R5 |
| BR-R6 | Conversion creates profile + onboarding checklist | Same service creates `User`, `Employee`, `Compensation`, `LeaveBalance`s, `OnboardingChecklist` | T-R6 |

## Attendance & leave

| ID | Rule | Enforcement | Test |
|----|------|-------------|------|
| BR-L1 | One attendance record per working day | **DB** unique `{employee, workDate}`; SVC `checkIn` returns "already checked in" | T-L1 |
| BR-L2 | Check out only after check in | SVC `checkOut` requires record with `checkInAt` and no `checkOutAt`; `checkOutAt > checkInAt` | T-L2 |
| BR-L3 | Late = after schedule start + grace | SVC `checkIn`: `lateMinutes = max(0, checkIn − (start + grace))`; status `late` if > 0 | T-L3 |
| BR-L4 | Check-in only on scheduled working days (non-holiday) | SVC `checkIn` uses `workdayService.isWorkingDay` (allow with warning flag if org wants overtime — default: block) | T-L4 |
| BR-L5 | No record ⇒ absent unless leave / holiday / day off | JOB `markAbsences(date)`: for each active employee without record → `on_leave` / `holiday` / `day_off` / `absent` | T-L5 |
| BR-L6 | Corrections requested by employee, approved by manager, need reason | SVC `attendanceService.requestCorrection` (reason required), `reviewCorrection` (manager of employee; reject needs reason); locked month blocks corrections | T-L6 |
| BR-L7 | Leave must not overlap pending/approved leave | SVC `leaveService.submit`: query `status ∈ {pending_manager, pending_hr, approved}` and `start ≤ new.end && end ≥ new.start` | T-L7 |
| BR-L8 | Leave must not exceed available balance | SVC: `workingDays ≤ allocated − used − pending` (skip when allowance null) | T-L8 |
| BR-L9 | Leave counted in working days | `workdayService.countWorkingDays` excludes schedule days off + holidays; computed **server-side**; 0 days ⇒ reject | T-L9 |
| BR-L10 | Manager reviews; HR also approves when required | SVC `review`: manager stage → `pending_hr` if `needsHr` else `approved`; HR stage only after manager approval | T-L10 |
| BR-L11 | Approved leave updates balance and attendance | On final approval: `pending → used`; upsert Attendance `on_leave` for each working day in range. On reject/cancel: release `pending` | T-L11 |

## Payroll, assets, leaving

| ID | Rule | Enforcement | Test |
|----|------|-------------|------|
| BR-P1 | Payroll from approved pay details, attendance, leave | SVC `payrollService.prepare(year, month)` requires `AttendanceMonth.status === 'locked'`; reads `Compensation`, locked summary (unpaid leave + absences), active loans | T-P1 |
| BR-P2 | Reviewed & approved before payslips published | State machine; `approve` requires `hr` role and `approvedBy ≠ preparedBy`; payslips `published=true` only on lock | T-P2 |
| BR-P3 | Locked payroll not editable; corrections via authorised adjustment | SVC guard + Mongoose hook on Payslip/PayrollRun; `PayrollAdjustment` (reason required, approved by HR) applied in next run or an `adjustment` run | T-P3 |
| BR-S1 | Asset assigned to one employee at a time | **DB** partial unique index on open assignments + SVC atomic `findOneAndUpdate({_id, status:'available'})` | T-S1 |
| BR-S2 | Issue and return recorded | `AssetAssignment` row for each issue; return sets `returnedAt`, `receivedBy`, `returnCondition`; damaged/lost updates asset status; audit | T-S2 |
| BR-S3 | Employee acknowledges receipt | SVC `acknowledge` — only the assignee | T-S3 |
| BR-X1 | Clearance before leaving: assets, handover, loans | SVC `closeExitCase` requires all clearance items done; asset item auto-checks "no open assignments"; loan item auto-checks "no active loan balance" | T-X1 |
| BR-X2 | Account deactivated after last working day | JOB `deactivateLeavers`: `lastWorkingDay < today(Kampala)` → `user.isActive=false`, `employee.status='exited'` | T-X2 |
| BR-X3 | Past records kept, never deleted | No delete routes for Employee/Attendance/Leave/Payslip/Audit; Mongoose `pre('deleteOne'/'deleteMany')` throws on those models | T-X3 |

## General

| ID | Rule | Enforcement | Test |
|----|------|-------------|------|
| BR-G1 | Required fields complete & accurate | `express-validator` per form + schema `required` | T-G1 |
| BR-G2 | Only authorised users approve / change official records | MW + SVC role/ownership; self-approval blocked (manager can't approve own leave → goes to their manager/HR) | T-G2 |
| BR-G3 | Rejection/correction/important change needs reason | SVC throws `ValidationError('Reason required')` | T-G3 |
| BR-G4 | History of important changes & approvals | `AuditLog` append-only; viewer page | T-G4 |
| BR-G5 | Kampala time, UGX | `utils/time.js`, `utils/money.js`; all views use helpers | T-G5 |

## Uganda payroll reference (store in Settings, verify before submission)

Monthly PAYE, resident individual (commonly used bands — **confirm with current URA tables**):

| Chargeable income (UGX/month) | Tax |
|------------------------------|-----|
| 0 – 235,000 | 0 |
| 235,001 – 335,000 | 10 % of amount over 235,000 |
| 335,001 – 410,000 | 10,000 + 20 % of amount over 335,000 |
| 410,001 – 10,000,000 | 25,000 + 30 % of amount over 410,000 |
| Above 10,000,000 | as above + additional 10 % of amount over 10,000,000 |

NSSF: employee 5 %, employer 10 % of gross.
