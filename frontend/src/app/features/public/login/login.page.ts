import { Component } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, NgClass, NgIf],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  mostrarPassword = false;
  formulario!: FormGroup;

  // Mensaje simple (sin modificar diseño: lo puedes renderizar donde ya tengas un div)
  errorMsg: string | null = null;

  // Para evitar doble submit
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.formulario = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  iniciarSesion(): void {
    this.errorMsg = null;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (this.cargando) return;
    this.cargando = true;

    const numeroIdentificacion = String(this.formulario.value.usuario ?? '').trim();
    const password = String(this.formulario.value.password ?? '');

    this.auth
      .login({ numeroIdentificacion, password })
      .subscribe({
        next: () => {
          this.cargando = false;
          this.router.navigateByUrl('/app/dashboard');
        },
        error: (err) => {
          this.cargando = false;

          // Mensaje amigable (si viene del backend lo mostramos)
          const msg =
            (err?.error?.mensaje as string) ||
            (err?.message as string) ||
            'No se pudo iniciar sesión';

          this.errorMsg = msg;
        },
      });
  }

  cambiarVisibilidadPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
