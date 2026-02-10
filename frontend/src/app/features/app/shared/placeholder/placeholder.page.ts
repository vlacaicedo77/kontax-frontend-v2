import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-placeholder',
  imports: [CommonModule],
  template: `
    <div class="card">
      <h1 class="title">{{ title }}</h1>
      <p class="sub">Página placeholder ✅</p>
      <p class="hint">Aquí irá el módulo real más adelante.</p>
    </div>
  `,
  styles: [`
    .card{
      background:#fff;
      border:1px solid rgba(15,23,42,.08);
      border-radius:16px;
      padding:18px;
      box-shadow: 0 8px 20px rgba(15,23,42,.06);
    }
    .title{ margin:0 0 6px; font-size:22px; font-weight:800; }
    .sub{ margin:0 0 10px; opacity:.8; }
    .hint{ margin:0; opacity:.7; }
  `],
})
export class PlaceholderPage {
  title = 'Módulo';

  constructor(route: ActivatedRoute) {
    this.title = route.snapshot.data['title'] ?? 'Módulo';
  }
}
