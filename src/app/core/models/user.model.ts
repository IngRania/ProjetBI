import { Role } from './role.model';

/** Utilisateur stocké (en mode simulé, le mot de passe est conservé en clair : démonstration uniquement). */
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

/** Utilisateur exposé à l'application (jamais de mot de passe). */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface NewUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}
