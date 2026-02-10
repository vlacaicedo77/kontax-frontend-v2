import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  LoginPayload,
  LoginResultado,
  RefreshResultado,
  UsuarioSesion,
  MeResultado,
} from './auth.models';
import { SessionManagerService } from './session-manager.service';
import { ThemeService, ThemeMode } from '../ui/theme.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'kontax_access_token';
  private readonly REFRESH_KEY = 'kontax_refresh_token';
  private readonly USER_KEY = 'kontax_usuario';
  private readonly MENU_KEY = 'kontax_menu';

  // ✅ para refresh programado tras F5
  private readonly ACCESS_EXP_AT = 'kontax_access_expires_at';

  private usuarioSubject = new BehaviorSubject<UsuarioSesion | null>(this.getUsuario());
  usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private sessionMgr: SessionManagerService,
    private theme: ThemeService
  ) {
    this.sessionMgr.configure({
      onRefresh: () => {
        // refresh silencioso: si falla => clean + redirect lo manejará interceptor o aquí
        this.refresh().subscribe({
          next: (r) => {
            // programar siguiente refresh
            this.sessionMgr.scheduleRefresh(r.expires_in);
          },
          error: () => {
            // si refresh falla, limpiamos
            this.clearSession();
          },
        });
      },
      onIdleLogout: () => {
        this.clearSession();
      },
    });
  }

  login(payload: LoginPayload): Observable<UsuarioSesion> {
    const body = {
      numero_identificacion: payload.numeroIdentificacion,
      password: payload.password,
    };

    return this.http
      .post<ApiResponse<LoginResultado>>(
        `${environment.apiBaseUrl}/auth/login?include=menu`,
        body
      )
      .pipe(
        map((res) => {
          if (res.estado !== 'OK' || !res.resultado) {
            throw new Error(res.mensaje || 'Error en login');
          }

          const r = res.resultado;

          const u: UsuarioSesion = {
            id: r.usuario.id,
            numeroIdentificacion: r.usuario.numero_identificacion,
            nombreCompleto: r.usuario.nombre_completo,
            email: r.usuario.email,
            theme: (r.usuario.theme as ThemeMode) ?? 'light',
          };

          // Persistencia tokens + usuario + menu
          localStorage.setItem(this.TOKEN_KEY, r.access_token);
          localStorage.setItem(this.REFRESH_KEY, r.refresh_token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(u));
          this.theme.setTheme(u.theme ?? 'light');
          this.setMenu(r.menu ?? null);

          // ✅ expires_at para programar refresh tras F5
          this.setAccessExpiresAt(r.expires_in);

          this.usuarioSubject.next(u);

          // ✅ Arrancar gestión de sesión (idle + refresh programado)
          this.sessionMgr.start();
          this.sessionMgr.scheduleRefresh(r.expires_in);

          return u;
        })
      );
  }

  /**
   * ✅ Importante: debe devolver RefreshResultado
   * para que interceptor y SessionManager puedan usar expires_in.
   */
  refresh(): Observable<RefreshResultado> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No hay refresh token');

    return this.http
      .post<ApiResponse<RefreshResultado>>(`${environment.apiBaseUrl}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .pipe(
        map((res) => {
          if (res.estado !== 'OK' || !res.resultado) {
            throw new Error(res.mensaje || 'No se pudo refrescar token');
          }

          localStorage.setItem(this.TOKEN_KEY, res.resultado.access_token);
          localStorage.setItem(this.REFRESH_KEY, res.resultado.refresh_token);
          this.setAccessExpiresAt(res.resultado.expires_in);
          return res.resultado;
        })
      );
  }

  me(): Observable<UsuarioSesion> {
    return this.http
      .get<ApiResponse<MeResultado>>(`${environment.apiBaseUrl}/auth/me?include=menu`)
      .pipe(
        map((res) => {
          if (res.estado !== 'OK' || !res.resultado) {
            throw new Error(res.mensaje || 'No autenticado');
          }

          const r = res.resultado.usuario;

          const u: UsuarioSesion = {
            id: r.id,
            numeroIdentificacion: r.numero_identificacion,
            nombreCompleto: r.nombre_completo,
            email: r.email,
            theme: (r.theme as ThemeMode) ?? 'light',
          };

          this.theme.setTheme(u.theme ?? 'light');

          localStorage.setItem(this.USER_KEY, JSON.stringify(u));
          this.setMenu(res.resultado.menu ?? null);

          this.usuarioSubject.next(u);

          // ✅ asegurar tracking de inactividad al rehidratar
          this.sessionMgr.start();

          return u;
        })
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${environment.apiBaseUrl}/auth/logout`, {})
      .pipe(
        map((res) => {
          // éxito o error => limpiamos igual (logout idempotente)
          this.clearSession();

          // opcional: usar res.mensaje si quieres
          void res;
        })
      );
  }

  clearSession(): void {
    this.sessionMgr.stop();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.MENU_KEY);
    localStorage.removeItem(this.ACCESS_EXP_AT);
    this.usuarioSubject.next(null);
  }

  // --- helpers ---
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getUsuario(): UsuarioSesion | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null;
  }

  getMenu(): any[] | null {
    const raw = localStorage.getItem(this.MENU_KEY);
    return raw ? (JSON.parse(raw) as any[]) : null;
  }

  setMenu(menu: any[] | null): void {
    if (menu && menu.length) {
      localStorage.setItem(this.MENU_KEY, JSON.stringify(menu));
    } else {
      localStorage.removeItem(this.MENU_KEY);
    }
  }

  private setAccessExpiresAt(expiresInSeconds: number): void {
    const expAt = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(this.ACCESS_EXP_AT, String(expAt));
  }

  /** ✅ para usar en el arranque de la app */
  getAccessExpiresInSeconds(): number | null {
    const raw = localStorage.getItem(this.ACCESS_EXP_AT);
    if (!raw) return null;

    const expAt = Number(raw);
    if (!Number.isFinite(expAt)) return null;

    const diffMs = expAt - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  }

  updateThemePreference(theme: 'light' | 'dark'): Observable<void> {
    return this.http
      .patch<ApiResponse<any>>(`${environment.apiBaseUrl}/auth/preferences`, { theme })
      .pipe(map(() => void 0));
  }
}
