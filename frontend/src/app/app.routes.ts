import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/public/home/home.page').then(m => m.HomePage),
  },
  {
    path: 'public/login',
    loadComponent: () =>
      import('./features/public/login/login.page').then(m => m.LoginPage),
  },

  {
    path: 'login',
    redirectTo: 'public/login',
    pathMatch: 'full',
  },


  // 🔐 PRIVATE (requiere sesión)
  {
    path: 'app',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/app/app.routes').then(m => m.APP_ROUTES),
  },

  // fallback
  {
    path: '**',
    redirectTo: '',
  },
];
