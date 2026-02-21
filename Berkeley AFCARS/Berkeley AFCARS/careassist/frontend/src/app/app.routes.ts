import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'cases',
    loadComponent: () =>
      import('./pages/cases/cases.component').then(
        (m) => m.CasesComponent
      ),
  },
  {
    path: 'cases/:id',
    loadComponent: () =>
      import('./pages/case-detail/case-detail.component').then(
        (m) => m.CaseDetailComponent
      ),
  },
  {
    path: 'messages',
    loadComponent: () =>
      import('./pages/messages/messages.component').then(
        (m) => m.MessagesComponent
      ),
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('./pages/calendar/calendar.component').then(
        (m) => m.CalendarComponent
      ),
  },
  {
    path: 'files',
    loadComponent: () =>
      import('./pages/files/files.component').then(
        (m) => m.FilesComponent
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'ai-assistant',
    loadComponent: () =>
      import('./pages/ai-assistant/ai-assistant.component').then(
        (m) => m.AiAssistantComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
