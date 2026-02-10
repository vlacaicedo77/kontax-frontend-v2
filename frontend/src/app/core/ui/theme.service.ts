import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'kontax_theme';
  private modeSig = signal<ThemeMode>(this.readInitial());

  mode = this.modeSig.asReadonly();

  getTheme(): ThemeMode {
    return this.modeSig();
  }

  setTheme(mode: ThemeMode): void {
    this.modeSig.set(mode);
    localStorage.setItem(this.KEY, mode);
    this.applyToDom(mode);
  }

  toggle(): ThemeMode {
    const next: ThemeMode = this.modeSig() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  /** ✅ Aplica data-theme SOLO si existe el wrapper del layout */
  applyToDom(mode: ThemeMode): void {
    const tryApply = (attempt: number) => {
      const el = document.getElementById('kontax-layout');
      if (el) {
        if (mode === 'dark') el.setAttribute('data-theme', 'dark');
        else el.removeAttribute('data-theme');
        return;
      }

      // ✅ reintentos cortos (máx 6 ~ 300ms)
      if (attempt < 6) {
        setTimeout(() => tryApply(attempt + 1), 50);
      }
    };

    tryApply(0);
  }

  private readInitial(): ThemeMode {
    const raw = localStorage.getItem(this.KEY);
    return raw === 'dark' ? 'dark' : 'light';
  }
}
