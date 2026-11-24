// Sidebar menu (docs/05-screens-and-routes.md, mockup NAV). Each item lists the
// roles that see it; '*' = every signed-in user. `ready: false` items are shown
// greyed out with a "soon" tag until their epic ships — flip to true when built.
export const NAV = [
  {
    label: 'Overview',
    items: [
      { href: '/', text: 'Dashboard', roles: ['*'], ready: true },
      { href: '/approvals', text: 'Approvals', roles: ['manager', 'hr'] },
    ],
  },
  {
    label: 'Me',
    items: [
      { href: '/attendance/me', text: 'My attendance', roles: ['employee'] },
      { href: '/leave', text: 'Leave', roles: ['employee'] },
      { href: '/me/payslips', text: 'Payslips', roles: ['employee'] },
      { href: '/me/assets', text: 'My assets', roles: ['employee'] },
      { href: '/me', text: 'My profile', roles: ['employee'] },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/employees', text: 'Employees', roles: ['hr', 'manager', 'payroll'] },
      { href: '/attendance/team', text: 'Team attendance', roles: ['manager'] },
      { href: '/onboarding', text: 'Onboarding', roles: ['hr', 'manager', 'asset'] },
      { href: '/exits', text: 'Offboarding', roles: ['hr', 'asset', 'payroll'] },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      { href: '/requisitions', text: 'Requisitions', roles: ['manager', 'hr', 'recruiter'] },
      { href: '/vacancies', text: 'Vacancies & pipeline', roles: ['recruiter', 'hr'] },
    ],
  },
  {
    label: 'Finance & assets',
    items: [
      { href: '/attendance/months', text: 'Attendance months', roles: ['payroll', 'hr'] },
      { href: '/payroll', text: 'Payroll', roles: ['payroll', 'hr'] },
      { href: '/assets', text: 'Assets', roles: ['asset', 'hr'] },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/users', text: 'Users', roles: ['admin'] },
      { href: '/admin/settings', text: 'Settings', roles: ['admin'] },
      { href: '/audit', text: 'Audit log', roles: ['admin', 'hr'] },
    ],
  },
];

/** Sections and items visible to a user, with `active` set for the current path. */
export function buildNav(user, currentPath = '/') {
  const roles = user?.roles ?? [];
  const sections = NAV.map((section) => ({
    label: section.label,
    items: section.items
      .filter((i) => i.roles.includes('*') || i.roles.some((r) => roles.includes(r)))
      .map((i) => ({ ...i, ready: i.ready === true, active: false })),
  })).filter((section) => section.items.length > 0);

  // Highlight only the most specific match (so /me/payslips doesn't also light up /me).
  const matches = (href) =>
    href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);
  let best = null;
  for (const item of sections.flatMap((s) => s.items)) {
    if (matches(item.href) && (!best || item.href.length > best.href.length)) best = item;
  }
  if (best) best.active = true;
  return sections;
}
