import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { closeAlert, showWarning, showInfo } from '../helpers/alerts';

type ApiErrorCodigo =
  | 'UNAUTHENTICATED'
  | 'TOKEN_INVALID'
  | 'SESSION_INVALID'
  | 'SESSION_REVOKED'
  | 'INACTIVITY'
  | 'USER_INVALID'
  | 'TOKEN_EXPIRED'
  | 'OTHER_DEVICE'
  | string;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;

  // ✅ evita alertas duplicadas ante múltiples 401 seguidos
  private sessionEndNotified = false;

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    const authReq =
      token && !this.isAuthFreeEndpoint(req.url)
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

        // Solo nos interesa el 401 en endpoints protegidos
        if (err.status === 401 && !this.isAuthFreeEndpoint(req.url)) {
          const codigo = (err.error?.codigo as ApiErrorCodigo) ?? null;

          // 1) Otro dispositivo (solo si backend lo declara)
          if (codigo === 'OTHER_DEVICE') {
            this.notifyAndLogout(
              '¡Hey, cuidado!',
              'Hemos detectado un inicio de sesión desde otro dispositivo. Por ello, tu sesión actual ha finalizado.'
            );
            return throwError(() => err);
          }

          // 2) Inactividad
          if (codigo === 'INACTIVITY') {
            this.notifyAndLogout(
              '¡Hey, advertencia!',
              'Por inactividad, tu sesión ha finalizado, inicia sesión nuevamente para continuar.'
            );
            return throwError(() => err);
          }

          // 3) Revocada genérica (logout u otras causas)
          if (codigo === 'SESSION_REVOKED') {
            this.notifyAndLogout(
              'Sesión finalizada',
              'Tu sesión ha finalizado. Inicia sesión nuevamente para continuar.'
            );
            return throwError(() => err);
          }

          // 4) Otros 401: intentamos refresh 1 vez
          if (this.refreshing) return throwError(() => err);

          // si no hay refresh token => cerramos sesión silencioso
          if (!this.auth.getRefreshToken()) {
            this.auth.clearSession();
            this.router.navigateByUrl('/public/login');
            return throwError(() => err);
          }

          this.refreshing = true;

          return this.auth.refresh().pipe(
            switchMap(() => {
              this.refreshing = false;

              const newToken = this.auth.getToken();
              if (!newToken) return throwError(() => err);

              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });

              return next.handle(retryReq);
            }),
            catchError((e: unknown) => {
              this.refreshing = false;

              // ✅ AQUÍ estaba tu bug: si el refresh falla por revocación/inactividad,
              // el endpoint es /auth/refresh y antes NO se mostraba el alert.
              if (e instanceof HttpErrorResponse) {
                const codigo2 = (e.error?.codigo as ApiErrorCodigo) ?? null;

                if (codigo2 === 'OTHER_DEVICE') {
                  this.notifyAndLogout(
                    '¡Hey, cuidado!',
                    'Hemos detectado un inicio de sesión desde otro dispositivo. Por ello, tu sesión actual ha finalizado.'
                  );
                  return throwError(() => e);
                }

                if (codigo2 === 'INACTIVITY') {
                  this.notifyAndLogout(
                    '¡Hey, advertencia!',
                    'Por inactividad, tu sesión ha finalizado, inicia sesión nuevamente para continuar.'
                  );
                  return throwError(() => e);
                }

                if (codigo2 === 'SESSION_REVOKED') {
                  this.notifyAndLogout(
                    'Sesión finalizada',
                    'Tu sesión ha finalizado. Inicia sesión nuevamente para continuar.'
                  );
                  return throwError(() => e);
                }
              }

              // Fallback: refresh falló por otra razón => logout silencioso
              this.auth.clearSession();
              this.router.navigateByUrl('/public/login');
              return throwError(() => e);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Muestra alerta, espera confirmación, luego limpia y navega
   * (con candado para evitar duplicados)
   */
  private notifyAndLogout(title: string, text: string): void {
    if (this.sessionEndNotified) {
      this.auth.clearSession();
      this.router.navigateByUrl('/public/login');
      return;
    }

    this.sessionEndNotified = true;

    closeAlert();

    // showWarning/showInfo devuelven Promise (Swal.fire); si no, Promise.resolve lo hace seguro.
    Promise.resolve(showWarning(title, text)).finally(() => {
      this.auth.clearSession();
      this.router.navigateByUrl('/public/login');
    });
  }

  private isAuthFreeEndpoint(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/refresh');
  }
}
