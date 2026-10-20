# Games 2019 – Portail BI CrossFit

Application Angular d'un projet étudiant de BI : un portail qui intègre le rapport Power BI sur les athlètes des **CrossFit Games 2019**, avec authentification, trois rôles (Administrateur, Analyste, Sportif) et gestion des utilisateurs.

> ⚠️ **Important**
> - L'authentification est **simulée côté navigateur** (localStorage / sessionStorage). Elle sert à la démonstration et **ne protège pas réellement les données**.
> - Un lien Power BI **« Publier sur le web » rend le rapport public** : toute personne qui possède le lien peut le consulter, même sans passer par l'application.

---

## 1. Prérequis

- **Node.js** : version 22.22.3 ou plus récente (22.x), ou 24.15+ (LTS recommandée). Vérifier avec `node -v`.
- **Angular CLI 22** : `npm install -g @angular/cli`

## 2. Installation et lancement

```bash
cd crossfit-portal
npm install
ng serve            # ou : npm start
```

Ouvrir <http://localhost:4200> dans Chrome ou Edge.

Build de production :

```bash
ng build            # résultat dans dist/crossfit-portal/browser
```

`ng build` a été exécuté et **passe sans erreur ni avertissement**.

## 3. Photo de la page de connexion

Placer la photo de compétition dans :

```
src/assets/login-bg.jpg
```

Si le fichier est absent, l'application compile quand même et affiche un **dégradé vert et jaune** à la place.
(Après avoir ajouté la photo pendant que `ng serve` tourne, relancer `ng serve`.)

## 4. Comptes de démonstration

| Rôle | E-mail | Mot de passe | Accès |
|---|---|---|---|
| Administrateur | admin@esprit.tn | admin123 | Tableau de bord, Salles de sport, Utilisateurs et rôles, Documentation |
| Analyste | analyste@esprit.tn | analyste123 | Tableau de bord (lecture seule), Documentation |
| Sportif | sportif@esprit.tn | sportif123 | Page de choix → Résultats ou Salles, avec « Retour au choix » |

Sur la page de connexion, les boutons **Administrateur / Analyste / Sportif** remplissent automatiquement le formulaire.

Pour remettre les comptes à zéro : outils de développement du navigateur → *Application* → *Local Storage* → supprimer la clé `users`.

## 5. Routes

| Route | Rôles autorisés |
|---|---|
| `/login` | public (un utilisateur déjà connecté est renvoyé vers sa page d'accueil) |
| `/home` | Sportif |
| `/dashboard` | tous |
| `/salles` | Administrateur, Sportif |
| `/admin/users` | Administrateur |
| `/documentation` | Administrateur, Analyste |

Non connecté → `/login`. Rôle non autorisé → page d'accueil du rôle (`/home` pour le sportif, `/dashboard` sinon).

## 6. Renseigner les liens Power BI

1. Dans Power BI Service : **Fichier → Incorporer le rapport → Publier sur le web (public)** → *Créer un code incorporé*.
2. Copier le lien `https://app.powerbi.com/view?r=...` : c'est le **lien du tableau de bord**.
3. Pour la page « Salles » : ouvrir cette page dans le Service, repérer `ReportSection...` dans l'adresse, puis ajouter `&pageName=ReportSection...` à la fin du lien copié.
4. Se connecter en **Administrateur** → **Utilisateurs et rôles** → carte **Rapports Power BI** → coller les deux liens → **Enregistrer**.

Les liens sont enregistrés dans `localStorage` (clé `powerBiLinks`) et remplacent les valeurs par défaut de `src/environments/environment.ts` (vides par défaut). On peut aussi les écrire directement dans `environment.ts`.

Seuls les liens `https://…powerbi.com/…` sont acceptés. Sans lien, le cadre affiche : *« Rapport Power BI non configuré. L'administrateur doit renseigner le lien. »*

> Remarque : les liens sont stockés dans le navigateur. Sur un autre ordinateur ou navigateur, il faut les saisir à nouveau (ou les mettre dans `environment.ts`).

## 7. Structure du projet

```
src/
├── environments/environment.ts      # mode du rapport, liens par défaut, URL de l'API future
├── assets/login-bg.jpg              # photo de fond (à ajouter)
└── app/
    ├── core/
    │   ├── models/                  # Role, User, Report (+ table rôle → RLS Power BI)
    │   ├── services/
    │   │   ├── auth-api.ts          # interface AuthApi + MockAuthApi  ← point de remplacement
    │   │   ├── auth.service.ts      # signals currentUser / isLoggedIn / role, login, logout, hasRole
    │   │   ├── users.service.ts     # utilisateurs (localStorage « users »)
    │   │   ├── report-config.service.ts
    │   │   └── powerbi-token.service.ts  # mode "embed" (mock)  ← point de remplacement
    │   └── guards/                  # authGuard, guestGuard, roleGuard (CanActivateFn)
    ├── shared/                      # header, sidebar, layout, report-view (+ powerbi-embed)
    └── features/                    # login, home, dashboard, salles, users, documentation
```

Toutes les pages sont chargées à la demande (lazy loading).

## 8. Brancher une vraie API (Spring Boot, .NET, FastAPI + JWT)

Le point de remplacement est l'interface **`AuthApi`** (`src/app/core/services/auth-api.ts`), fournie dans `app.config.ts` :

```ts
{ provide: AUTH_API, useClass: MockAuthApi },
```

1. Créer une implémentation HTTP :

```ts
@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);
  login(email: string, password: string) {
    // Le backend vérifie le mot de passe (haché) et renvoie { user, token } où token est un JWT signé.
    return this.http.post<AuthSession>(`${environment.apiBaseUrl}/auth/login`, { email, password });
  }
}
```

2. Dans `app.config.ts` :

```ts
provideHttpClient(withInterceptors([jwtInterceptor])),
{ provide: AUTH_API, useClass: HttpAuthApi },
```

3. Écrire un intercepteur qui ajoute `Authorization: Bearer <token>` (le jeton est disponible via `AuthService.token()`).
4. Remplacer `UsersService` (aujourd'hui en localStorage) par des appels `GET/POST/PATCH/DELETE /api/users`.
5. **Le backend doit lui-même vérifier le rôle** contenu dans le JWT : les gardes Angular ne font que masquer les pages, elles ne sécurisent rien.

## 9. Mode « embed » (avancé, optionnel)

Le mode par défaut est `iframe` (« Publier sur le web »). Le mode `embed` utilise les paquets `powerbi-client` et `powerbi-client-angular` (déjà installés) et permet un rapport **privé** avec sécurité au niveau des lignes (RLS).

1. Dans `environment.ts` : `reportMode: 'embed'`.
2. Remplacer `MockPowerBiTokenService` (`powerbi-token.service.ts`), qui renvoie des valeurs vides, par une implémentation qui appelle **votre backend**, par exemple `GET /api/powerbi/embed-token?report=dashboard`, et renvoie `{ reportId, embedUrl, accessToken, pageName }`.
3. Le backend :
   - s'authentifie auprès d'Azure AD (principal de service ou compte maître) — **les secrets restent côté serveur, jamais dans le front** ;
   - lit le rôle de l'utilisateur dans son JWT ;
   - applique la table `POWER_BI_RLS_ROLES` (`src/app/core/models/role.model.ts`) :

     | Rôle application | Rôle RLS Power BI |
     |---|---|
     | Administrateur | aucun filtre |
     | Analyste | aucun filtre |
     | Sportif | `Sportif` |

   - appelle l'API REST Power BI `POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/reports/{reportId}/GenerateToken` avec l'identité effective (`identities`) et renvoie le jeton d'intégration.

Le composant d'intégration est chargé avec `@defer` : il n'alourdit pas l'application en mode `iframe`.

## 10. Si « Publier sur le web » est désactivé

Ce réglage est contrôlé par l'administrateur du locataire Power BI de l'école. Sans lien, l'application affiche simplement le message « Rapport Power BI non configuré ». Solutions : demander à l'enseignante le compte ou l'option à utiliser, ou passer au mode `embed` avec un backend.

## 11. Ordre conseillé pour la démonstration

1. Page de connexion (photo en fond, aucun texte hors formulaire).
2. Administrateur : tableau de bord, salles de sport, ajout d'un utilisateur, liens Power BI.
3. Analyste : tableau de bord uniquement.
4. Sportif : page de choix → résultats → « Retour au choix » → salles.
5. Rappeler que l'authentification est simulée et que « Publier sur le web » rend le rapport public.
