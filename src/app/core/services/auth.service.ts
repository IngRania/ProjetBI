import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ROLE_HOME, Role } from '../models/role.model';
import { AuthSession, User } from '../models/user.model';
import { AUTH_API } from './auth-api';
import { UsersService } from './users.service';

const SESSION_KEY = 'session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AUTH_API);
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);

  private readonly session = signal<AuthSession | null>(this.restore());

  readonly currentUser = computed<User | null>(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly role = computed<Role | null>(() => this.currentUser()?.role ?? null);
  readonly token = computed(() => this.session()?.token ?? null);

  constructor() {
    // Si l'administrateur modifie le rôle ou supprime le compte connecté, la session suit.
    effect(() => {
      this.users.users();
      const current = this.session();
      if (!current) return;
      const fresh = this.users.findById(current.user.id);
      if (!fresh) {
        this.logout();
      } else if (fresh.role !== current.user.role || fresh.name !== current.user.name) {
        this.setSession({ ...current, user: fresh });
      }
    });
  }

  login(email: string, password: string): Observable<User> {
    return this.api.login(email, password).pipe(
      tap((session) => this.setSession(session)),
      map((session) => session.user),
    );
  }

  logout(): void {
    this.setSession(null);
    this.router.navigateByUrl('/login');
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  /** Page d'accueil de l'utilisateur courant. */
  homeUrl(): string {
    const r = this.role();
    return r ? ROLE_HOME[r] : '/login';
  }

  private setSession(session: AuthSession | null): void {
    this.session.set(session);
    try {
      if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  private restore(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }
}
