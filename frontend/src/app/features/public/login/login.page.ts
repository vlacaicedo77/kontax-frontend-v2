import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  mostrarPassword = false;

  /*formulario = this.fb.group({
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });*/

  constructor(private fb: FormBuilder) {}

  // Por ahora vacío (diseño primero)
  iniciarSesion(): void {}

  cambiarVisibilidadPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
