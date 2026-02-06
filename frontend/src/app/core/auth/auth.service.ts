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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'kontax_access_token';
  private readonly REFRESH_KEY = 'kontax_refresh_token';
  private readonly USER_KEY = 'kontax_usuario';

  private usuarioSubject = new BehaviorSubject<UsuarioSesion | null>(this.getUsuario());
  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<UsuarioSesion> {
    const body = {
      numero_identificacion: payload.numeroIdentificacion,
      password: payload.password,
    };

    return this.http
      .post<ApiResponse<LoginResultado>>(`${environment.apiBaseUrl}/auth/login`, body)
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
          };

          localStorage.setItem(this.TOKEN_KEY, r.access_token);
          localStorage.setItem(this.REFRESH_KEY, r.refresh_token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(u));
          this.usuarioSubject.next(u);

          return u;
        })
      );
  }

  refresh(): Observable<void> {
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
        })
      );
  }

  me(): Observable<UsuarioSesion> {
    return this.http
      .get<ApiResponse<MeResultado>>(`${environment.apiBaseUrl}/auth/me`)
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
          };

          localStorage.setItem(this.USER_KEY, JSON.stringify(u));
          this.usuarioSubject.next(u);
          return u;
        })
      );
  }

  logout(): Observable<void> {
    return this.http.post<ApiResponse<unknown>>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      map((res) => {
        // Si se cerró bien => OK. Si ya estaba cerrada y devuelve ERR, igual limpiamos.
        this.clearSession();
        if (res.estado !== 'OK') {
          // opcional: podrías mostrar res.mensaje
        }
      })
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.usuarioSubject.next(null);
  }

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
}
