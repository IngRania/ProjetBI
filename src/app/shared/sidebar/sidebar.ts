import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Role } from '../../core/models/role.model';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: 'chart' | 'gym' | 'users' | 'doc';
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', path: '/dashboard', icon: 'chart', roles: ['ADMIN', 'ANALYST'] },
  { label: 'Salles de sport', path: '/salles', icon: 'gym', roles: ['ADMIN'] },
  { label: 'Utilisateurs et rôles', path: '/admin/users', icon: 'users', roles: ['ADMIN'] },
  { label: 'Documentation', path: '/documentation', icon: 'doc', roles: ['ADMIN', 'ANALYST'] },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  readonly open = input(false);
  readonly navigate = output<void>();

  protected readonly items = computed(() => {
    const role = this.auth.role();
    return role ? NAV_ITEMS.filter((i) => i.roles.includes(role)) : [];
  });
}
