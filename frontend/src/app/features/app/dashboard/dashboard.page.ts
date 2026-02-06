import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
      <h1>Dashboard</h1>
      <p>Kontax privado ✅</p>

      <button (click)="logout()"
        style="padding:10px 16px;border-radius:8px;border:none;cursor:pointer;">
        Cerrar sesión
      </button>
    </div>
  `,
})
export class DashboardPage {
  constructor(private router: Router) {}

  logout() {
    localStorage.clear();
    this.router.navigateByUrl('/public/login');
  }
}
