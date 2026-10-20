export type Role = 'ADMIN' | 'ANALYST' | 'ATHLETE';

export const ROLES: readonly Role[] = ['ADMIN', 'ANALYST', 'ATHLETE'];

/** Libellés affichés dans l'interface (en français). */
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrateur',
  ANALYST: 'Analyste',
  ATHLETE: 'Sportif',
};

/** Page d'accueil de chaque rôle après connexion. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard',
  ANALYST: '/dashboard',
  ATHLETE: '/home',
};

/**
 * Correspondance rôle de l'application → rôle de sécurité (RLS) Power BI.
 * Utilisée par le BACKEND au moment de générer le jeton d'intégration (mode "embed").
 * null = aucun filtre de sécurité.
 */
export const POWER_BI_RLS_ROLES: Record<Role, string | null> = {
  ADMIN: null,
  ANALYST: null,
  ATHLETE: 'Sportif',
};
