import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/role.model';

const roles = (...r: Role[]) => ({ roles: r });

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Connexion – Games 2019',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: 'home',
        canActivate: [roleGuard],
        data: roles('ATHLETE'),
        title: 'Accueil – Games 2019',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: roles('ADMIN', 'ANALYST', 'ATHLETE'),
        title: 'Tableau de bord – Games 2019',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'salles',
        canActivate: [roleGuard],
        data: roles('ADMIN', 'ATHLETE'),
        title: 'Salles de sport – Games 2019',
        loadComponent: () => import('./features/salles/salles').then((m) => m.Salles),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: roles('ADMIN'),
        title: 'Utilisateurs et rôles – Games 2019',
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'documentation',
        canActivate: [roleGuard],
        data: roles('ADMIN', 'ANALYST'),
        title: 'Documentation – Games 2019',
        loadComponent: () => import('./features/documentation/documentation').then((m) => m.Documentation),
      },
      // "/" et toute adresse inconnue : renvoi vers la page d'accueil du rôle (via roleGuard sur /home).
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: '' },
];
