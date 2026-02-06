import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private refreshing = false;

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    const authReq =
      token && !this.isAuthFreeEndpoint(req.url)
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

        // Si 401 en endpoints protegidos => intentamos refresh una vez
        if (err.status === 401 && !this.isAuthFreeEndpoint(req.url)) {
          if (this.refreshing) {
            // si ya está refrescando, deja que falle (o podrías colar una cola)
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
            catchError((e) => {
              this.refreshing = false;
              this.auth.clearSession();
              return throwError(() => e);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }

  private isAuthFreeEndpoint(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/refresh');
  }
}
