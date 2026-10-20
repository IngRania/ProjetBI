export type ReportMode = 'iframe' | 'embed';

/** Les deux pages du rapport Power BI. */
export type ReportKey = 'dashboard' | 'gyms';

export interface ReportLinks {
  dashboardUrl: string;
  gymsUrl: string;
}

/** Informations nécessaires au mode "embed" (fournies par le backend). */
export interface EmbedConfig {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  pageName?: string;
}
