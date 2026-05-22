# Utilitaires Généraux Otterbots

Ce document détaille les fonctions utilitaires générales disponibles à la racine de `src/otterbots/utils`. Ces utilitaires gèrent des fonctionnalités transverses comme les logs, l'activité du bot, l'initialisation des salons et les tâches planifiées.

## 1. Gestion de l'Activité (`activity.ts`)

Ce fichier permet de définir et mettre à jour le statut d'activité du bot sur Discord.

### `otterBots_setActivity(activityType, activity, client)`

Configure l'activité affichée du bot (ex: "Joue à ...", "Regarde ...").

**Paramètres :**
- `activityType` (string) : Le type d'activité. Valeurs acceptées :
  - `"playing"` : Joue à
  - `"streaming"` : Streame
  - `"listening"` : Écoute
  - `"watching"` : Regarde
  - `"competing"` : En compétition dans
- `activity` (string) : Le nom ou la description de l'activité.

**Exemple :**
```typescript
bot.setActivity("playing", "Otterbots v1.0");
```

---

## 2. Affichage du Logo (`displayLogo.ts`)

Affiche une bannière ASCII stylisée dans la console lors du démarrage de l'application.

### `displayLogo(name)`

**Paramètres :**
- `name` (string, optionnel) : Le texte à afficher en ASCII. Par défaut : `"Otterbots"`.

**Exemple :**
```typescript
displayLogo("MonBot");
```

---

## 3. Gestion des Salons (`salon.ts`)

Gère la création automatique et la récupération des salons et catégories Discord basés sur la configuration.

### `otterBots_initSalon(client)`

Initialise les salons au démarrage du bot.
- Vérifie l'existence de la guilde (serveur).
- Crée un rôle spécifique pour le bot si nécessaire.
- Parcourt la configuration `salonCategory` et `botSalon`.
- Crée les catégories et les salons manquants avec les permissions appropriées.
- Met à jour le fichier `channels.json` avec les IDs des nouveaux salons.
- Crée des webhooks pour les salons si configuré.

### `getSalonByAlias(alias)`

Récupère les informations d'un salon à partir de son alias défini dans `channels.json`.

**Paramètres :**
- `alias` (string) : L'identifiant unique (alias) du salon.

**Retour :**
- `JsonSalonType` : Objet contenant `name`, `categoryName`, `id`, et `webhook`.
- `void` : Si le salon n'est pas trouvé.

### Configuration (`app/config/salon.ts`)

La configuration des salons se fait via deux tableaux exportés :

1.  **`salonCategory`** : Définit les catégories.
    ```typescript
    export const salonCategory: SalonCategory[] = [
        {
            id: 1,
            name: "Nom de la catégorie",
            role_id: "ID du rôle autorisé"
        }
    ]
    ```

2.  **`botSalon`** : Définit les salons textuels.
    ```typescript
    export const botSalon: SalonType[] = [
        {
            alias: "mon-salon", // Alias utilisé dans le code
            name: "nom-discord", // Nom affiché sur Discord
            role_id: "ID du rôle",
            category: 1, // ID de la catégorie parente
            type: 1,
            webhook: true // Créer un webhook automatiquement ?
        }
    ];
    ```

---

## 4. Gestionnaire de Tâches (`task.ts`)

Système de planification de tâches (Cron jobs) basé sur `node-cron`.

### `otterbots_initTask()`

Charge et planifie toutes les tâches définies dans `app/config/task.ts`.
- Parcourt la liste des tâches.
- Valide l'expression Cron.
- Planifie l'exécution de la fonction associée.
- Log le succès ou l'échec de l'initialisation de chaque tâche.

**Configuration (`app/config/task.ts`) :**
Les tâches sont définies dans le tableau `tasks`.

```typescript
export const tasks = [
    {
        name: "description",
        time: "0 0 * * *", // Expression Cron
        task: async () => maFonction(), // Fonction à exécuter
        period: "" // Optionnel
    }
];
```

**Exemple d'utilisation (interne) :**
Cette fonction est appelée automatiquement au démarrage pour activer les tâches récurrentes (ex: sauvegardes, notifications périodiques).
