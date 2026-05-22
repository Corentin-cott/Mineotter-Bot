# OtterPocketBase - Gestionnaire PocketBase via Alias

OtterPocketBase est une classe utilitaire permettant de gérer les interactions avec une instance PocketBase en utilisant des alias définis dans un fichier de configuration YAML. Cette approche permet de centraliser la gestion des collections et des actions, tandis que la connexion et l'authentification sont sécurisées via les variables d'environnement.

## Configuration

Le fichier `endpoint_alias.yaml` à la racine du projet définit uniquement les alias :

```yaml
aliases:
  - alias: "get_users"
    collection: "users"
    action: "getList"
  - alias: "get_user_by_id"
    collection: "users"
    action: "getOne"
    options:
      expand: "profile"
```

---

## Connexion et Authentification

La connexion est entièrement gérée via le fichier `.env`.

**Variables d'environnement requises :**
- `PB_URL` : L'URL de votre instance PocketBase (ex: `https://votre-pocketbase.com`).
- `PB_EMAIL` : L'email du compte Superuser.
- `PB_PASSWORD` : Le mot de passe associé.

Si `PB_EMAIL` et `PB_PASSWORD` sont présents lors du `init()`, le bot tentera une authentification `authWithPassword` exclusivement sur la collection `_superusers` (compatible PocketBase v0.23+). Sinon, il fonctionnera en mode invité.

---

## Classe `OtterPocketBase`

### Initialisation

L'initialisation est désormais **automatique**. La connexion à PocketBase et le chargement de la configuration YAML se font lors du premier appel à `execByAlias()` ou `getClient()`. Vous n'avez plus besoin d'appeler `init()` manuellement.

### Utilisation des Alias

#### `execByAlias<T>(alias, ...params)`
Exécute l'action associée à l'alias. Le tableau ci-dessous détaille les paramètres attendus pour chaque action :

| Action | Paramètre 1 | Paramètre 2 | Paramètre 3 | Description |
| :--- | :--- | :--- | :--- | :--- |
| `getList` | `page` (number) | `perPage` (number) | `options` (object) | Récupère une liste paginée. |
| `getFullList` | `options` (object) | - | - | Récupère tous les enregistrements. |
| `getOne` | `id` (string) | `options` (object) | - | Récupère un enregistrement par son ID. |
| `getFirstListItem` | `filter` (string) | `options` (object) | - | Récupère le premier élément correspondant au filtre. |
| `create` | `data` (object) | `options` (object) | - | Crée un nouvel enregistrement. |
| `update` | `id` (string) | `data` (object) | `options` (object) | Met à jour un enregistrement existant. |
| `delete` | `id` (string) | `options` (object) | - | Supprime un enregistrement. |

**Exemples :**

```typescript
import { OtterPocketBase } from "@/otterbots/utils/pocketbase/pocketbase";

// Pas besoin d'init() !
const users = await OtterPocketBase.execByAlias("get_users");

// Récupérer un document par ID avec des options de requête
const user = await OtterPocketBase.execByAlias("get_user_by_id", "RECORD_ID", { expand: "roles" });

// Créer un document
const newLog = await OtterPocketBase.execByAlias("create_log", { 
    message: "Action effectuée",
    user: "12345" 
});

// Supprimer un document
await OtterPocketBase.execByAlias("delete_log", "RECORD_ID");
```

### Accès Direct au Client

#### `getClient()` (Méthode statique asynchrone)
Si vous avez besoin d'utiliser des fonctionnalités spécifiques non couvertes par les alias (ex: Realtime/Subscriptions), utilisez `getClient()`. Elle garantit que l'instance est initialisée avant de vous la retourner.

```typescript
const client = await OtterPocketBase.getClient();
client.collection('messages').subscribe('*', (e) => {
    console.log(e.action, e.record);
});
```

---

## Développement et Types

Lors de l'appel à `execByAlias<T>`, il est fortement recommandé de passer une interface pour typer le retour :

```typescript
interface User {
    id: string;
    username: string;
}

const user = await OtterPocketBase.execByAlias<User>("get_user_by_id", "ID");
// user est de type User | undefined
```
