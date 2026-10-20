import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthSession } from '../models/user.model';
import { UsersService } from './users.service';

/**
 * Contrat d'authentification. C'est LE point de remplacement par une vraie API.
 * Une implémentation HTTP appellera par exemple POST {apiBaseUrl}/auth/login
 * et renverra { user, token } où token est un JWT signé par le serveur.
 */
export interface AuthApi {
  login(email: string, password: string): Observable<AuthSession>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Identifiants incorrects');
  }
}

/** Implémentation simulée : vérifie les comptes stockés dans localStorage et renvoie un faux jeton. */
@Injectable()
export class MockAuthApi implements AuthApi {
  private readonly users = inject(UsersService);

  login(email: string, password: string): Observable<AuthSession> {
    const user = this.users.findByCredentials(email, password);
    if (!user) {
      return throwError(() => new InvalidCredentialsError()).pipe(delay(250));
    }
    const fakeToken = 'mock.' + btoa(JSON.stringify({ sub: user.id, role: user.role, iat: Date.now() })) + '.unsigned';
    return of({ user, token: fakeToken }).pipe(delay(250));
  }
}

/*
 * Exemple d'implémentation HTTP (à activer quand le backend existe) :
 *
 * @Injectable()
 * export class HttpAuthApi implements AuthApi {
 *   private readonly http = inject(HttpClient);
 *   login(email: string, password: string) {
 *     return this.http.post<AuthSession>(`${environment.apiBaseUrl}/auth/login`, { email, password });
 *   }
 * }
 *
 * Puis dans app.config.ts : { provide: AUTH_API, useClass: HttpAuthApi }, provideHttpClient(withInterceptors([...]))
 */
