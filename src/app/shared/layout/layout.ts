import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';

/** Gabarit des pages connectées : barre du haut + menu latéral (sauf pour le sportif). */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header, Sidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header [showMenuToggle]="hasSidebar()" [menuOpen]="menuOpen()" (menuToggle)="menuOpen.set(!menuOpen())" />
    <div class="shell" [class.no-sidebar]="!hasSidebar()">
      @if (hasSidebar()) {
        <app-sidebar [open]="menuOpen()" (navigate)="menuOpen.set(false)" />
        @if (menuOpen()) {
          <div class="backdrop" (click)="menuOpen.set(false)" aria-hidden="true"></div>
        }
      }
      <main class="content" id="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .shell { flex: 1; display: grid; grid-template-columns: 240px 1fr; min-height: 0; }
    .shell.no-sidebar { grid-template-columns: 1fr; }
    .content { min-width: 0; }
    .backdrop { display: none; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .backdrop { display: block; position: fixed; inset: var(--header-h) 0 0 0; background: rgba(14, 59, 43, 0.35); z-index: 20; }
    }
  `,
})
export class Layout {
  private readonly auth = inject(AuthService);
  protected readonly hasSidebar = computed(() => this.auth.hasRole('ADMIN', 'ANALYST'));
  protected readonly menuOpen = signal(false);
}
