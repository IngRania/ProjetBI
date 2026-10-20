import { Injectable, computed, signal } from '@angular/core';
import { Role } from '../models/role.model';
import { NewUser, StoredUser, User } from '../models/user.model';

const STORAGE_KEY = 'users';

const DEMO_USERS: StoredUser[] = [
  { id: 'u-admin', name: 'Administrateur ESPRIT', email: 'admin@esprit.tn', password: 'admin123', role: 'ADMIN' },
  { id: 'u-analyst', name: 'Analyste BI', email: 'analyste@esprit.tn', password: 'analyste123', role: 'ANALYST' },
  { id: 'u-athlete', name: 'Sportif CrossFit', email: 'sportif@esprit.tn', password: 'sportif123', role: 'ATHLETE' },
];

/**
 * Gestion des utilisateurs, persistés dans localStorage (clé "users").
 * À remplacer par des appels HTTP (GET/POST/PATCH/DELETE /api/users) quand une API existera.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly store = signal<StoredUser[]>(this.load());

  /** Liste publique, sans mots de passe. */
  readonly users = computed<User[]>(() => this.store().map(toPublicUser));

  findByCredentials(email: string, password: string): User | null {
    const normalized = email.trim().toLowerCase();
    const match = this.store().find((u) => u.email.toLowerCase() === normalized && u.password === password);
    return match ? toPublicUser(match) : null;
  }

  findById(id: string): User | null {
    const match = this.store().find((u) => u.id === id);
    return match ? toPublicUser(match) : null;
  }

  emailExists(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.store().some((u) => u.email.toLowerCase() === normalized);
  }

  add(data: NewUser): User {
    const user: StoredUser = {
      id: 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: data.role,
    };
    this.save([...this.store(), user]);
    return toPublicUser(user);
  }

  updateRole(id: string, role: Role): void {
    this.save(this.store().map((u) => (u.id === id ? { ...u, role } : u)));
  }

  remove(id: string): void {
    this.save(this.store().filter((u) => u.id !== id));
  }

  private save(users: StoredUser[]): void {
    this.store.set(users);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
      /* stockage indisponible : on garde la liste en mémoire */
    }
  }

  private load(): StoredUser[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredUser[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USERS));
    } catch {
      /* ignore */
    }
    return [...DEMO_USERS];
  }
}

function toPublicUser({ id, name, email, role }: StoredUser): User {
  return { id, name, email, role };
}
