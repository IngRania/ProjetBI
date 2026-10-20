import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ReportKey, ReportLinks, ReportMode } from '../models/report.model';

const STORAGE_KEY = 'powerBiLinks';

/**
 * Configuration des rapports Power BI.
 * Les liens saisis par l'administrateur (localStorage) remplacent ceux d'environment.ts.
 */
@Injectable({ providedIn: 'root' })
export class ReportConfigService {
  readonly mode: ReportMode = environment.reportMode;

  private readonly overrides = signal<Partial<ReportLinks>>(this.load());

  readonly links = computed<ReportLinks>(() => ({
    dashboardUrl: this.overrides().dashboardUrl || environment.powerBi.dashboardUrl,
    gymsUrl: this.overrides().gymsUrl || environment.powerBi.gymsUrl,
  }));

  urlFor(key: ReportKey): string {
    const l = this.links();
    return (key === 'dashboard' ? l.dashboardUrl : l.gymsUrl).trim();
  }

  save(links: ReportLinks): void {
    const clean: ReportLinks = { dashboardUrl: links.dashboardUrl.trim(), gymsUrl: links.gymsUrl.trim() };
    this.overrides.set(clean);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      /* ignore */
    }
  }

  /** Vérifie qu'un lien est bien une adresse https Power BI. */
  static isValidPowerBiUrl(url: string): boolean {
    if (!url) return true; // vide = non configuré, autorisé
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && /(^|\.)powerbi\.com$/i.test(u.hostname);
    } catch {
      return false;
    }
  }

  private load(): Partial<ReportLinks> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Partial<ReportLinks>) : {};
    } catch {
      return {};
    }
  }
}
