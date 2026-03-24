import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { workerOnlyGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/home-router/home-router.component').then(
        (m) => m.HomeRouterComponent
      ),
  },
  {
    path: 'cases',
    canActivate: [authGuard, workerOnlyGuard],
    loadComponent: () =>
      import('./pages/cases/cases.component').then(
        (m) => m.CasesComponent
      ),
  },
  {
    path: 'cases/:id',
    canActivate: [authGuard, workerOnlyGuard],
    loadComponent: () =>
      import('./pages/case-detail/case-detail.component').then(
        (m) => m.CaseDetailComponent
      ),
  },
  {
    path: 'messages',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/messages/messages.component').then(
        (m) => m.MessagesComponent
      ),
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/calendar/calendar.component').then(
        (m) => m.CalendarComponent
      ),
  },
  {
    path: 'files',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/files/files.component').then(
        (m) => m.FilesComponent
      ),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'ai-assistant',
    canActivate: [authGuard, workerOnlyGuard],
    loadComponent: () =>
      import('./pages/ai-assistant/ai-assistant.component').then(
        (m) => m.AiAssistantComponent
      ),
  },
  {
    path: 'resources',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/youth-resources/youth-resources.component').then(
        (m) => m.YouthResourcesComponent
      ),
  },
  {
    path: 'records',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/youth-records/youth-records.component').then(
        (m) => m.YouthRecordsComponent
      ),
  },
  {
    path: 'foster-resources',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/foster-resources/foster-resources.component').then(
        (m) => m.FosterResourcesComponent
      ),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/notifications/notifications.component').then(
        (m) => m.NotificationsComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
