/**
 * Configuration par défaut de l'application.
 * Aucun secret ne doit être placé ici : ce fichier est livré au navigateur.
 */
export const environment = {
  /** "iframe" (Publier sur le web) ou "embed" (powerbi-client, nécessite un backend). */
  reportMode: 'iframe' as 'iframe' | 'embed',
  /** Liens « Publier sur le web ». Vides par défaut : l'administrateur les renseigne dans l'application. */
  powerBi: {
    dashboardUrl: '',
    gymsUrl: '',
  },
  /** URL de la future API (Spring Boot, .NET ou FastAPI). Non utilisée en mode simulé. */
  apiBaseUrl: 'http://localhost:8080/api',
};
