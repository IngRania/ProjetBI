import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ROLE_LABELS } from '../../core/models/role.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(AuthService);

  /** Affiche le bouton « menu » sur mobile (seulement s'il y a un menu latéral). */
  readonly showMenuToggle = input(false);
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();

  protected readonly user = this.auth.currentUser;
  protected readonly roleLabel = computed(() => {
    const r = this.auth.role();
    return r ? ROLE_LABELS[r] : '';
  });

  protected logout(): void {
    this.auth.logout();
  }
}
