# Ottercache - Système de Cache Persistant

Ottercache est une classe générique permettant de gérer un cache clé-valeur simple avec persistance automatique dans un fichier JSON.

## Classe `OtterCache<T>`

### Initialisation

#### `constructor(fileName)`
Crée une nouvelle instance de cache.
- **fileName** : Nom du fichier de sauvegarde (ex: "users.json"). Sera stocké dans le dossier `cache/` à la racine du projet.
- Charge automatiquement les données existantes si le fichier existe.

**Exemple :**
```typescript
const userCache = new OtterCache<UserData>("users");
```

---

### Manipulation des Données

#### `set(key, value)`
Ajoute ou met à jour une entrée dans le cache.
- Ajoute un timestamp `updatedAt` automatiquement.
- Déclenche une sauvegarde automatique (autosave) différée.

#### `get(key)`
Récupère la valeur associée à une clé.
- **Retour** : `T | null`

#### `delete(key)`
Supprime une entrée et déclenche une sauvegarde.

#### `clear()`
Vide entièrement le cache et sauvegarde le fichier vide.

#### `getAll()`
Récupère la Map interne complète.

---

### Utilitaires de Collection

Ces méthodes imitent le comportement des objets `Map` ou `Array` standards :

- **`keys()`** : Retourne un tableau de toutes les clés.
- **`values()`** : Retourne un tableau de toutes les valeurs (sans les métadonnées).
- **`entries()`** : Retourne un tableau de paires `[clé, valeur]`.
- **`size()`** : Retourne le nombre d'éléments dans le cache.

---

### Persistance et Autosave

### Configuration

Ottercache est conçu pour être "Zero-Config".
- **Dossier de stockage** : Il crée et utilise automatiquement un dossier `cache/` à la racine du projet.
- **Fichiers** : Chaque instance gère son propre fichier `.json` dont le nom est passé au constructeur.
