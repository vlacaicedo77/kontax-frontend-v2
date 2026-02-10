import { Component, computed, signal, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { MenuItemApi } from '../../../core/auth/auth.models';
import { showConfirmCustom, showLoading, closeAlert, showSuccessAutoClose, showError } from '../../../core/helpers/alerts';
import { ThemeService } from '../../../core/ui/theme.service';

// Fallback mínimo por si aún no viene menú (no rompe el UI)
const FALLBACK_MENU: MenuItemApi[] = [{ label: 'Dashboard', route: '/app/dashboard' }];

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [CommonModule, RouterModule],
  templateUrl: './app-shell.page.html',
  styleUrl: './app-shell.page.scss',
})
export class AppShellPage implements OnDestroy, AfterViewInit {

  ngAfterViewInit(): void {
    // ✅ ahora sí existe #kontax-layout
    this.themeService.applyToDom(this.themeService.getTheme());
  }

  private themeService = inject(ThemeService);
  theme = this.themeService.mode;
  // Móvil: drawer con overlay
  sidebarOpen = signal(false);

  // Desktop: dock colapsable (solo íconos)
  sidebarCollapsed = signal(false);

  // Detectar desktop
  private mq = window.matchMedia('(min-width: 992px)');
  isDesktop = signal(this.mq.matches);

  currentUrl = signal('');

  userName = computed(() => this.auth.getUsuario()?.nombreCompleto ?? 'Usuario');
  userNum = computed(() => this.auth.getUsuario()?.numeroIdentificacion ?? '');
  userEmail = computed(() => this.auth.getUsuario()?.email ?? '');

  // ✅ menú dinámico (desde localStorage)
  menu = signal<MenuItemApi[]>(FALLBACK_MENU);

  // grupos abiertos
  openGroups = signal<Record<string, boolean>>({});

  //theme = this.themeService.mode;


  private mqListener = (e: MediaQueryListEvent) => {
    this.isDesktop.set(e.matches);

    // Al pasar a desktop: el overlay no aplica
    if (e.matches) this.sidebarOpen.set(false);
  };

  constructor(
    private auth: AuthService,
    private router: Router
  ) {

    this.themeService.applyToDom(this.theme());
    // Listener responsive
    this.mq.addEventListener('change', this.mqListener);
    document.addEventListener('click', this.onDocClick);

    // url inicial
    this.currentUrl.set(this.router.url);

    // cargar menú guardado
    const storedMenu = this.auth.getMenu();
    if (storedMenu?.length) {
      this.menu.set(storedMenu as MenuItemApi[]);
    }

    // auto-open por url
    this.autoOpenGroupsByUrl(this.currentUrl());

    // en cada navegación: actualizar url, auto-open y cerrar sidebar solo en móvil
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.autoOpenGroupsByUrl(this.router.url);
        this.closeSidebar();
      });
  }

  ngOnDestroy(): void {
    this.mq.removeEventListener('change', this.mqListener);
    document.removeEventListener('click', this.onDocClick);
  }

  isDark(): boolean {
    return this.themeService.getTheme() === 'dark';
  }

  toggleTheme(): void {
    const next = this.isDark() ? 'light' : 'dark';

    // ✅ UX instantáneo
    this.themeService.setTheme(next);

    // ✅ persistir en backend (no bloquea UI)
    this.auth.updateThemePreference(next).subscribe({
      error: () => {
        // opcional: aviso suave; yo NO revertiría
        // showWarning('Aviso', 'No se pudo guardar tu preferencia, pero el tema seguirá aplicado en este dispositivo.');
      },
    });
  }

  /**
   * Botón hamburguesa:
   * - móvil: abre/cierra drawer
   * - desktop: colapsa/expande fijo (solo íconos)
   */
  toggleSidebar(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.set(!this.sidebarCollapsed());
    } else {
      this.sidebarOpen.set(!this.sidebarOpen());
    }
  }

  /**
   * Cerrar sidebar:
   * - móvil: sí (drawer)
   * - desktop: NO (dock siempre visible)
   */
  closeSidebar(): void {
    if (!this.isDesktop()) {
      this.sidebarOpen.set(false);
    }
  }

  logoutFromMenu(): void {
    this.closeUserMenu();

    showConfirmCustom('¿Desea salir del sistema?', '', 'Sí', 'No').then((r) => {
      if (!r.isConfirmed) return;

      showLoading('Cerrando sesión...');

      this.auth.logout().subscribe({
        next: () => {
          //showSuccessAutoClose('¡Hasta pronto!', 1200);
          this.router.navigateByUrl('/public/login');
          closeAlert();
        },
        error: () => {
          //showSuccessAutoClose('¡Hasta pronto!', 1200);
          this.router.navigateByUrl('/public/login');
          closeAlert();
        },
      });
    });
  }

  // --- helpers menú ---
  hasChildren(item: MenuItemApi): boolean {
    return !!item.children?.length;
  }

  isGroupOpen(label: string): boolean {
    return !!this.openGroups()[label];
  }

  toggleGroup(label: string): void {
    this.openGroups.set({
      ...this.openGroups(),
      [label]: !this.openGroups()[label],
    });
  }

  isItemActive(item: MenuItemApi, currentUrl: string): boolean {
    if (item.route && this.routeMatch(currentUrl, item.route)) return true;
    if (item.children?.length) {
      return item.children.some((c) => c.route && this.routeMatch(currentUrl, c.route));
    }
    return false;
  }

  private routeMatch(currentUrl: string, targetRoute: string): boolean {
    return currentUrl === targetRoute || currentUrl.startsWith(targetRoute + '/');
  }

  private autoOpenGroupsByUrl(currentUrl: string): void {
    const next: Record<string, boolean> = { ...this.openGroups() };

    for (const item of this.menu()) {
      if (this.hasChildren(item)) {
        next[item.label] = this.isItemActive(item, currentUrl);
      }
    }

    this.openGroups.set(next);
  }

  userMenuOpen = signal(false);

  toggleUserMenu(ev?: MouseEvent): void {
    // IMPORTANTE: evita que el click burbujee al document y se cierre
    ev?.stopPropagation();
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  // Para cerrar al click afuera
  private onDocClick = () => this.userMenuOpen.set(false);

}
