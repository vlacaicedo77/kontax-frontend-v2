import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  constructor(private router: Router) {}

  irLogin(): void {
    this.router.navigate(['/public/login']);
  }
}
