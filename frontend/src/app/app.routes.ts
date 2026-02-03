import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/public/home/home.page')
        .then(m => m.HomePage)
  },
  {
    path: 'public/login',
    loadComponent: () =>
      import('./features/public/login/login.page').then(m => m.LoginPage),
  }

  /*{
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.LoginComponent)
  }*/
];
