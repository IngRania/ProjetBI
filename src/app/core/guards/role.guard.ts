import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/role.model';
import { AuthService } from '../services/auth.service';

/**
 * Vérifie que le rôle de l'utilisateur figure dans route.data['roles'].
 * Sinon : redirection vers la page d'accueil de son rôle (ou /login s'il n'est pas connecté).
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];
  if (allowed.length === 0 || auth.hasRole(...allowed)) return true;
  return router.parseUrl(auth.homeUrl());
};
