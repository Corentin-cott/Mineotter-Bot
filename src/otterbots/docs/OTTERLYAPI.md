# OtterlyAPI - Gestionnaire d'API

OtterlyAPI est une classe utilitaire permettant de gérer dynamiquement les routes API utilisées par le bot. Elle permet de récupérer la configuration des routes depuis une source distante, de les mettre en cache localement, et d'effectuer des requêtes HTTP simplifiées via des alias.

## Classe `Otterlyapi`

### Initialisation

#### `init()`
Initialise le système API.
- Récupère les dernières routes depuis l'API configurée (`API_ROUTES_URL`).
- Met à jour le fichier local `otterlyApiRoutes.json`.
- Log le succès ou l'échec de l'opération.

**Exemple :**
```typescript
const api = new Otterlyapi();
await api.init();
```

---

### Méthodes Statiques (Utilisation Courante)

#### `getDataByAlias<T>(alias, param?)`
Effectue une requête **GET** vers la route associée à l'alias donné.

**Paramètres :**
- `alias` (string) : L'identifiant de la route (ex: "get_user").
- `param` (string, optionnel) : Un paramètre à ajouter à la fin de l'URL (remplace `:param` ou s'ajoute à la fin).

**Retour :**
- `Promise<T | undefined>` : Les données typées `T` ou `undefined` en cas d'erreur.

**Exemple :**
```typescript
const userData = await Otterlyapi.getDataByAlias<UserType>("get_user", "12345");
```

#### `postDataByAlias<T>(alias, data)`
Effectue une requête **POST** vers la route associée à l'alias donné.

**Paramètres :**
- `alias` (string) : L'identifiant de la route.
- `data` (T) : Le corps de la requête (payload).

**Retour :**
- `Promise<T | undefined>` : La réponse typée `T` ou `undefined`.

**Note :** Nécessite que `API_TOKEN` soit défini dans les variables d'environnement pour l'authentification.

**Exemple :**
```typescript
const result = await Otterlyapi.postDataByAlias("create_report", { reason: "spam" });
```

#### `getRoutesInfosByAlias(alias)`
Récupère les métadonnées brutes d'une route (URL, méthode, etc.) depuis le fichier JSON local.

**Paramètres :**
- `alias` (string) : L'alias de la route.

**Retour :**
- `RoutesType | undefined`

---

## Fonctionnement Interne

## Configuration

OtterlyAPI ne possède pas de fichier de configuration TypeScript dédié, mais repose sur :

1.  **Variables d'Environnement (.env)** :
    - `API_ROUTES_URL` : L'URL de l'API distante qui fournit la liste des routes.
    - `API_TOKEN` : Le token d'authentification pour les requêtes POST.

2.  **Fichier de Cache (`otterlyApiRoutes.json`)** :
    Ce fichier est généré automatiquement à la racine (ou lu s'il existe) et contient la liste des routes.
    Structure attendue :
    ```json
    [
      {
        "alias": "get_user",
        "route": "https://api.example.com/users/:id",
        "method": "GET"
      }
    ]
    ```
