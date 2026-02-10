import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { showLoading, closeAlert, showSuccessAutoClose, showError } from '../../../core/helpers/alerts';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, NgClass],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  mostrarPassword = false;
  formulario!: FormGroup;
  submitting = false;
errorMsg: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.formulario = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  iniciarSesion(): void {
	this.errorMsg = null;
    if (this.submitting) return;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.submitting = true;
    showLoading('Autenticando...');

    this.auth
      .login({
        numeroIdentificacion: this.formulario.value.usuario,
        password: this.formulario.value.password,
      })
      .subscribe({
        next: () => {

          //showSuccessAutoClose('¡Hola, bienvenido/a!', 1200);
          this.router.navigateByUrl('/app/dashboard');
          closeAlert();
        },
        error: (err) => {
          closeAlert();
          const msg =
            err?.error?.mensaje || err?.message || 'Error de autenticación';
          showError('Error', msg);
          this.errorMsg = msg;
        },
      })
      .add(() => {
        this.submitting = false;
      });
  }

  cambiarVisibilidadPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
