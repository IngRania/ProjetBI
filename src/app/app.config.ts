import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AUTH_API, MockAuthApi } from './core/services/auth-api';
import { MockPowerBiTokenService, POWER_BI_TOKEN_SERVICE } from './core/services/powerbi-token.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Points de remplacement vers une vraie API (voir README) :
    { provide: AUTH_API, useClass: MockAuthApi },
    { provide: POWER_BI_TOKEN_SERVICE, useClass: MockPowerBiTokenService },
  ],
};
