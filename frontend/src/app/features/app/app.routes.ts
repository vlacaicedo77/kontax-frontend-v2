import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/app-shell.page').then(m => m.AppShellPage),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'ventas',
        children: [
          {
            path: 'nueva',
            loadComponent: () => import('./shared/placeholder/placeholder.page').then(m => m.PlaceholderPage),
            data: { title: 'Ventas / Nueva' },
          },
          {
            path: 'listado',
            loadComponent: () => import('./shared/placeholder/placeholder.page').then(m => m.PlaceholderPage),
            data: { title: 'Ventas / Listado' },
          },
        ],
      },
      {
        path: 'compras',
        children: [
          {
            path: 'nueva',
            loadComponent: () => import('./shared/placeholder/placeholder.page').then(m => m.PlaceholderPage),
            data: { title: 'Compras / Nueva' },
          },
          {
            path: 'proveedores',
            loadComponent: () => import('./shared/placeholder/placeholder.page').then(m => m.PlaceholderPage),
            data: { title: 'Compras / Proveedores' },
          },
        ],
      },
      {
        path: 'reportes',
        children: [
          {
            path: 'ventas',
            loadComponent: () => import('./shared/placeholder/placeholder.page').then(m => m.PlaceholderPage),
            data: { title: 'Reportes / Ventas' },
          },
          {
            path: 'compras',
            loadComponent: () => import('./shared/placeholder/placeholder.page').then(m => m.PlaceholderPage),
            data: { title: 'Reportes / Compras' },
          },
        ],
      },
    ],
  },
];
