import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { SessionManagerService } from './core/auth/session-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {

  protected readonly title = signal('kontax-frontend');

  constructor(
    private auth: AuthService,
    private sessionMgr: SessionManagerService
  ) {
    if (this.auth.isAuthenticated()) {
      this.sessionMgr.start();
      const left = this.auth.getAccessExpiresInSeconds();
      if (left !== null) this.sessionMgr.scheduleRefresh(left);
    }
  }
}
