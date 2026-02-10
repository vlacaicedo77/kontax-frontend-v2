import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, fromEvent, merge } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { showWarning } from '../helpers/alerts';

@Injectable({ providedIn: 'root' })
export class SessionManagerService implements OnDestroy {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private activitySub?: Subscription;

  private readonly IDLE_TTL_SECONDS = 1800; // 30 min
  private readonly REFRESH_SKEW_SECONDS = 25;
  private readonly ACTIVITY_THROTTLE_MS = 800;

  /**
   * Callbacks (los define AuthService o App)
   * para que SessionManager NO dependa de AuthService.
   */
  private onRefresh?: () => void;
  private onIdleLogout?: () => void;

  constructor(private router: Router) {}

  /** Conecta callbacks una sola vez (o cuando quieras) */
  configure(opts: { onRefresh: () => void; onIdleLogout: () => void }): void {
    this.onRefresh = opts.onRefresh;
    this.onIdleLogout = opts.onIdleLogout;
  }

  /** Inicia tracking de inactividad */
  start(): void {
    this.startActivityTracking();
    this.resetIdleTimer();
  }

  /** Detiene TODO */
  stop(): void {
    this.clearRefreshTimer();
    this.clearIdleTimer();
    this.activitySub?.unsubscribe();
    this.activitySub = undefined;
  }

  /** Programa refresh automático */
  scheduleRefresh(expiresInSeconds: number): void {
    this.clearRefreshTimer();

    const seconds = Math.max(5, expiresInSeconds - this.REFRESH_SKEW_SECONDS);
    const ms = seconds * 1000;

    this.refreshTimer = setTimeout(() => {
      // Si no hay callback configurado, no hacemos nada
      this.onRefresh?.();
    }, ms);
  }

  // --- idle ---
  private resetIdleTimer(): void {
    this.clearIdleTimer();

    this.idleTimer = setTimeout(() => {
      showWarning(
        '¡Hey, advertencia!',
        'Por inactividad, tu sesión ha finalizado, inicia sesión nuevamente para continuar.'
      );

      this.onIdleLogout?.();

      // fallback defensivo (si no configuras callbacks)
      this.router.navigateByUrl('/public/login');
    }, this.IDLE_TTL_SECONDS * 1000);
  }

  private startActivityTracking(): void {
    if (this.activitySub) return;

    const events$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'touchstart'),
      fromEvent(window, 'scroll')
    ).pipe(throttleTime(this.ACTIVITY_THROTTLE_MS));

    this.activitySub = events$.subscribe(() => {
      this.resetIdleTimer();
    });
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
