# 03 — Data Model (Mongoose)

All schemas use `{ timestamps: true }`. `ref` = ObjectId reference. Money fields are integer UGX. **Nothing employee-related is ever hard-deleted** (no delete routes; statuses instead).

## Identity & organisation

### User
| Field | Type | Notes |
|-------|------|-------|
| email | String, unique, lowercase | login |
| displayName | String, required | top bar / greeting; needed because admin accounts have no Employee |
| passwordHash | String, `select: false` | bcrypt |
| roles | [String] enum: admin, hr, recruiter, manager, payroll, asset, employee | ≥1 |
| employee | ref Employee | null for pure admin accounts |
| isActive | Boolean, default true | checked every request |
| lastLoginAt | Date | |

### Department
`name` (unique), `head` ref Employee.

### WorkSchedule
`name`, `workDays: [Number]` (1=Mon…7=Sun), `startTime "08:00"`, `endTime "17:00"`, `graceMinutes` (default 15).

### Employee
| Field | Type | Notes |
|-------|------|-------|
| employeeNo | String, unique | `SH-0001`, auto |
| firstName, lastName, otherNames | String | legal name → change via request |
| workEmail, phone, personalEmail, address, emergencyContact{name,phone,relation} | | self-editable: phone, personalEmail, address, emergencyContact |
| department | ref Department | |
| jobTitle | String | |
| manager | ref Employee | team = employees whose manager == me |
| schedule | ref WorkSchedule | |
| hireDate | Date | |
| status | enum: onboarding, active, exiting, exited | |
| lastWorkingDay | Date | set by exit case |
| sourceApplication | ref Application | set on conversion (proves no re-entry) |

Index: `{ manager: 1 }`, `{ status: 1 }`.

### Compensation  *(restricted: HR, Payroll, self)*
`employee` (unique ref), `basicSalary`, `allowances: [{name, amount}]`, `bankName`, `bankAccountNo`, `nationalId (NIN)`, `tin`, `nssfNo`, `effectiveFrom`.

### ProfileChangeRequest
`employee`, `field` enum (legalName, bankDetails, nationalId), `currentValue` (masked), `requestedValue` (Mixed), `status` pending/approved/rejected, `reviewedBy`, `reason`.

## Attendance & leave

### Attendance
| Field | Notes |
|-------|-------|
| employee | ref |
| workDate | `"YYYY-MM-DD"` Kampala |
| checkInAt, checkOutAt | Date (UTC) |
| status | present, late, absent, on_leave, holiday, day_off |
| lateMinutes | Number |
| source | self, correction, system |
| leaveRequest | ref, when on_leave |

**Unique index `{ employee: 1, workDate: 1 }`** → one record per working day (DB-level guarantee).

### AttendanceCorrection
`attendance` ref (or `employee` + `workDate` if missing), `requestedCheckIn`, `requestedCheckOut`, `reason` (required), `status`, `reviewedBy`, `reviewReason`.

### AttendanceMonth
`year`, `month`, `status` open/locked, `lockedBy`, `lockedAt`, `summary: [{ employee, workingDays, present, late, absent, onLeave, unpaidLeave }]`. Unique `{year, month}`. Payroll reads **only** this locked summary.

### Holiday
`date "YYYY-MM-DD"` unique, `name`. Seed Uganda public holidays for 2026.

### LeaveType
`code` (ANNUAL, SICK, MATERNITY, PATERNITY, UNPAID, COMPASSIONATE), `name`, `annualAllowance` (null = unlimited), `paid` Boolean, `requiresHrApproval` Boolean.

### LeaveBalance
`employee`, `leaveType`, `year`, `allocated`, `used`, `pending`. Unique `{employee, leaveType, year}`. Available = allocated − used − pending.

### LeaveRequest
`employee`, `leaveType`, `startDate`, `endDate` (Kampala date strings), `workingDays` (computed server-side), `reason`, `status` pending_manager/pending_hr/approved/rejected/cancelled, `needsHr` Boolean, `managerDecision{by, at, reason}`, `hrDecision{by, at, reason}`.
Index `{ employee: 1, status: 1, startDate: 1 }` for overlap queries.

## Recruitment & hiring

### Requisition
`requestedBy` (manager), `department`, `jobTitle`, `headcount`, `justification`, `employmentType`, `budgetSalaryMin/Max`, `status`, `decision{by, at, reason}`.

### Vacancy
`requisition` (required, must be approved), `title`, `description`, `requirements`, `location`, `closingDate "YYYY-MM-DD"`, `status` draft/published/closed, `publishedBy`, `slug`.

### Application  *(public, no account)*
`vacancy`, `fullName`, `email` (lowercased), `phone`, `coverLetter`, `cvUrl` (link, MVP), `status`, `notes[]`.
**Unique index `{ vacancy: 1, email: 1 }`** → no duplicate applications.

### Interview
`application`, `scheduledAt`, `mode` (in_person/phone/online), `panel [ref User]`, `outcome` (pending/pass/fail), `notes`.

### Offer
`application` (unique), `jobTitle`, `department`, `manager`, `basicSalary`, `startDate`, `status`, `approval{by, at, reason}`, `sentAt`, `respondedAt`, `employee` (set on conversion — prevents double conversion).

### OnboardingChecklist
`employee`, `tasks: [{ title, assigneeRole (hr/manager/employee/asset), assignee ref User, done, doneBy, doneAt }]`. Template in settings.

## Payroll

### PayrollRun
`year`, `month` (unique pair for regular runs), `type` regular/adjustment, `status` draft/submitted/approved/locked, `preparedBy`, `approvedBy` (≠ preparedBy), `lockedAt`, `totals{gross, paye, nssfEmployee, nssfEmployer, deductions, net}`, `attendanceMonth` ref (must be locked).

### Payslip
`run`, `employee`, `basic`, `allowances[]`, `gross`, `unpaidDays`, `absenceDeduction`, `paye`, `nssfEmployee`, `nssfEmployer`, `loanDeduction`, `adjustments[]`, `otherDeductions[]`, `net`, `published` Boolean. Unique `{run, employee}`.
Mongoose `pre('save'|'findOneAndUpdate')` hook rejects edits when run is locked (belt and braces on top of the service check).

### PayrollAdjustment
`employee`, `targetRun` (locked run being corrected), `amount` (+/−), `reason` (required), `createdBy`, `approvedBy`, `appliedInRun`.

### Loan
`employee`, `principal`, `monthlyInstalment`, `balance`, `status` active/settled.

### Settings (single doc)
`graceMinutesDefault`, `hrApprovalThresholdDays`, `payeBands: [{from, to, rate, base}]`, `nssfEmployeeRate 0.05`, `nssfEmployerRate 0.10`, `absenceDeductionEnabled`, `onboardingTemplate[]`, `clearanceTemplate[]`.

## Assets

### Asset
`tag` unique (`AST-0001`), `name`, `category`, `serialNo`, `purchaseDate`, `value`, `status` available/assigned/damaged/lost/retired, `currentAssignment` ref AssetAssignment.

### AssetAssignment
`asset`, `employee`, `issuedBy`, `issuedAt`, `acknowledgedAt`, `returnedAt`, `receivedBy`, `returnCondition` (good/damaged/lost), `notes`.
**Partial unique index `{ asset: 1 }` where `returnedAt` is null** → one holder at a time, at the database level.

## Offboarding & performance

### ExitCase
`employee`, `type` resignation/termination/contract_end/retirement, `noticeDate`, `lastWorkingDay`, `reason`, `status`, `clearance: [{ key (assets, handover, loan, it_access, final_pay), owner role, done, doneBy, doneAt, notes }]`, `closedBy`.

### PerformanceReview *(P2)*
`employee`, `reviewer`, `period`, `rating 1–5`, `strengths`, `improvements`, `status` draft/submitted/acknowledged.

## Cross-cutting

### AuditLog
`actor` ref User, `action` (e.g. `leave.approve`), `entity`, `entityId`, `before`, `after`, `reason`, `at`. Index `{ entity: 1, entityId: 1 }`, `{ at: -1 }`. Append-only (no update/delete routes).

### Notification *(P1)*
`user`, `message`, `link`, `read`. Shown as a bell count; replaces email in MVP.
