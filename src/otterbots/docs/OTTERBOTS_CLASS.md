# Classe Otterbots - API Publique

La classe `Otterbots` est le point d'entrée principal du framework. Elle gère l'initialisation, le démarrage et la configuration du bot Discord.

## Initialisation

### `constructor(client?)`

Crée une nouvelle instance du bot Otterbots.

**Paramètres :**
- `client` (Client, optionnel) : Une instance personnalisée de `Client` Discord.js. Si non fourni, utilise la configuration par défaut depuis `app/config/client.ts`.

**Exemple :**
```typescript
import { Otterbots } from './otterbots';

// Utilisation simple (configuration par défaut)
const bot = new Otterbots();

// Ou avec un client personnalisé
import { Client, GatewayIntentBits } from 'discord.js';
const customClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});
const bot = new Otterbots(customClient);
```

---

## Méthodes Publiques

### `start()`

Démarre le bot et initialise tous les modules.

**Fonctionnement :**
1. Affiche le logo ASCII dans la console
2. Se connecte à Discord avec le token
3. Initialise les événements (`clientReady`, `interactionCreate`)
4. Charge les commandes et événements personnalisés
5. Initialise les salons automatiques
6. Active les réactions emoji automatiques
7. Initialise le module OtterlyAPI

**Exemple :**
```typescript
const bot = new Otterbots();
bot.start();
```

> **Note :** Cette méthode doit être appelée une seule fois après l'instanciation.

---

### `getClient()`

Récupère l'instance du client Discord.js utilisée par le bot.

**Retour :**
- `Client` : L'instance Discord.js

**Exemple :**
```typescript
const bot = new Otterbots();
const client = bot.getClient();

// Utiliser le client pour des opérations avancées
client.on('messageCreate', (message) => {
    console.log(`Message reçu : ${message.content}`);
});
```

---

### `setActivity(activityType?, activity)`

Définit le statut d'activité du bot affiché sur Discord.

**Paramètres :**
- `activityType` (string, optionnel) : Le type d'activité. Par défaut : `"playing"`.
  - `"playing"` : Joue à
  - `"streaming"` : Streame
  - `"listening"` : Écoute
  - `"watching"` : Regarde
  - `"competing"` : En compétition dans
- `activity` (string) : Le texte de l'activité à afficher.

**Exemple :**
```typescript
const bot = new Otterbots();
bot.start();

// Affiche "Joue à Otterbots v1.0"
bot.setActivity("playing", "Otterbots v1.0");

// Affiche "Écoute de la musique"
bot.setActivity("listening", "de la musique");

// Affiche "Regarde les utilisateurs" (par défaut "playing")
bot.setActivity(undefined, "les utilisateurs");
```

---

### `purgeCommand(client?)`

Supprime toutes les commandes slash enregistrées sur Discord.

**Paramètres :**
- `client` (Client, optionnel) : L'instance du client. Par défaut, utilise le client interne.

**Retour :**
- `Promise<void>`

**Utilisation :**
Utile pour nettoyer les commandes lors du développement ou avant de redéployer une nouvelle version.

**Exemple :**
```typescript
const bot = new Otterbots();
bot.start();

// Supprimer toutes les commandes
await bot.purgeCommand();
```

> **⚠️ Attention :** Cette action supprime toutes les commandes slash du bot. Utilisez avec précaution.

---

### `startOtterGuard(client?)`

Active le module de sécurité Otterguard.

**Paramètres :**
- `client` (Client, optionnel) : L'instance du client. Par défaut, utilise le client interne.

**Fonctionnement :**
Active les protections configurées dans `app/config/otterguardConfig.ts` :
- Protection anti-liens
- Protection anti-scam
- Protection anti-spam

**Exemple :**
```typescript
const bot = new Otterbots();
bot.start();

// Activer la protection
bot.startOtterGuard();
```

📚 [Documentation Otterguard](./OTTERGUARD.md)

---

### `initTask()`

Initialise et démarre les tâches planifiées (cron jobs).

**Fonctionnement :**
Charge et planifie toutes les tâches définies dans `app/config/task.ts`.

**Exemple :**
```typescript
const bot = new Otterbots();
bot.start();

// Démarrer les tâches planifiées
bot.initTask();
```

📚 [Documentation des tâches](./UTILS_GENERAUX.md#4-gestionnaire-de-tâches-taskts)

---

## Exemple d'Utilisation Complète

```typescript
import { Otterbots } from './otterbots';

// Créer et démarrer le bot
const bot = new Otterbots();
bot.start();

// Configurer l'activité
bot.setActivity("playing", "avec les loutres 🦦");

// Activer la sécurité
bot.startOtterGuard();

// Démarrer les tâches planifiées
bot.initTask();

// Accéder au client pour des opérations avancées
const client = bot.getClient();
client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user?.tag}`);
});
```

---

## Ordre d'Initialisation Recommandé

1. **Créer l'instance** : `const bot = new Otterbots()`
2. **Démarrer le bot** : `bot.start()`
3. **Configurer l'activité** : `bot.setActivity(...)`
4. **Activer Otterguard** (optionnel) : `bot.startOtterGuard()`
5. **Démarrer les tâches** (optionnel) : `bot.initTask()`

---

## Notes Importantes

- La méthode `start()` doit être appelée **avant** toute autre méthode publique.
- Les modules (salons, OtterlyAPI, événements) sont automatiquement initialisés par `start()`.
- Pour des configurations avancées, utilisez `getClient()` pour accéder directement au client Discord.js.
