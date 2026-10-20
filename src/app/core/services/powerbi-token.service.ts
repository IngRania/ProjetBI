import { Injectable, InjectionToken } from '@angular/core';
import { Observable, of } from 'rxjs';
import { EmbedConfig, ReportKey } from '../models/report.model';

/**
 * Fournit reportId, embedUrl et accessToken pour le mode "embed".
 * Le jeton d'intégration DOIT être généré par un backend (API REST Power BI,
 * principal de service Azure AD). Aucun secret côté navigateur.
 */
export interface PowerBiTokenService {
  getEmbedConfig(report: ReportKey): Observable<EmbedConfig>;
}

export const POWER_BI_TOKEN_SERVICE = new InjectionToken<PowerBiTokenService>('POWER_BI_TOKEN_SERVICE');

/** Implémentation simulée : renvoie des valeurs vides (le rapport s'affiche alors comme « non configuré »). */
@Injectable()
export class MockPowerBiTokenService implements PowerBiTokenService {
  getEmbedConfig(_report: ReportKey): Observable<EmbedConfig> {
    return of({ reportId: '', embedUrl: '', accessToken: '' });
  }
}

/*
 * Implémentation réelle (exemple) :
 *   getEmbedConfig(report) {
 *     return this.http.get<EmbedConfig>(`${environment.apiBaseUrl}/powerbi/embed-token?report=${report}`);
 *   }
 * Le backend lit le rôle de l'utilisateur dans son JWT, applique POWER_BI_RLS_ROLES
 * (role.model.ts) dans l'identité effective, puis appelle
 * POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports/{reportId}/GenerateToken
 */
