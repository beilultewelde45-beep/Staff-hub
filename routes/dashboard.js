import { Router } from 'express';

export const dashboardRouter = Router();

// Role-aware dashboard. Widgets are filled in by later epics (H-01); for now it
// greets the user and lists their roles so RBAC can be demoed on Day 1.
dashboardRouter.get('/', (req, res) => {
  res.render('dashboard/index', { title: 'Dashboard' });
});
