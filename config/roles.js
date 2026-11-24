// Role keys from docs/01-scope-and-requirements.md §2. A user can hold several roles.
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  HR: 'hr',
  RECRUITER: 'recruiter',
  MANAGER: 'manager',
  PAYROLL: 'payroll',
  ASSET: 'asset',
  EMPLOYEE: 'employee',
});

export const ROLE_KEYS = Object.freeze(Object.values(ROLES));

export const ROLE_LABELS = Object.freeze({
  admin: 'System Administrator',
  hr: 'HR Manager',
  recruiter: 'Recruiter',
  manager: 'Line Manager',
  payroll: 'Payroll Officer',
  asset: 'Asset Officer',
  employee: 'Employee',
});

export function hasAnyRole(user, roles) {
  if (!user || !Array.isArray(user.roles)) return false;
  return roles.some((r) => user.roles.includes(r));
}
