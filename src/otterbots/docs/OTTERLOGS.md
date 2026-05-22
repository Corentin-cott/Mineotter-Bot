# Otterlogs - Système de Logging Avancé

Otterlogs est le système de logging centralisé d'Otterbots. Il combine la puissance de **Pino** pour les logs console avec l'intégration de **Webhooks Discord** pour les notifications en temps réel.

## Vue d'ensemble

Le système offre plusieurs niveaux de logs avec :
- Formatage coloré dans la console
- Envoi automatique vers Discord via webhooks
- Configuration granulaire par niveau de log
- Support des environnements de développement et production

---

## Niveaux de Logs

### `otterlogs.success(message)`

Log de **succès** pour les opérations réussies.

**Caractéristiques :**
- Couleur : Vert
- Type : `info` (Pino)
- Webhook : Oui (si activé)

**Exemple :**
```typescript
otterlogs.success("Le bot a démarré avec succès !");
otterlogs.success("Connexion à la base de données établie");
```

---

### `otterlogs.log(message)`

Log **informatif** standard pour les événements normaux.

**Caractéristiques :**
- Couleur : Bleu
- Type : `info` (Pino)
- Webhook : Oui (si activé)

**Exemple :**
```typescript
otterlogs.log("Chargement de 15 commandes...");
otterlogs.log("Utilisateur connecté : Jean#1234");
```

---

### `otterlogs.warn(message)`

Log d'**avertissement** pour les situations anormales mais non critiques.

**Caractéristiques :**
- Couleur : Jaune
- Type : `warn` (Pino)
- Webhook : Oui (si activé)

**Exemple :**
```typescript
otterlogs.warn("Tentative de connexion échouée, nouvelle tentative...");
otterlogs.warn("Cache expiré, rechargement nécessaire");
```

---

### `otterlogs.error(message)`

Log d'**erreur** pour les problèmes critiques.

**Caractéristiques :**
- Couleur : Rouge
- Type : `error` (Pino)
- Webhook : Oui, sur le canal d'erreur dédié (`ERROR_WEBHOOK_URL`)

**Exemple :**
```typescript
otterlogs.error("Impossible de se connecter à la base de données");
otterlogs.error(`Erreur lors du traitement : ${error.message}`);
```

---

### `otterlogs.important(message)`

Log pour les messages **importants** nécessitant une attention particulière.

**Caractéristiques :**
- Couleur : Jaune
- Type : `info` (Pino)
- Webhook : Oui (si activé)

**Exemple :**
```typescript
otterlogs.important("Mise à jour critique disponible !");
otterlogs.important("Maintenance planifiée dans 1 heure");
```

---

### `otterlogs.debug(message)`

Log de **débogage**, visible uniquement en mode développement.

**Caractéristiques :**
- Visible uniquement si `NODE_ENV === "dev"`
- Type : `info` (Pino)
- Webhook : Non

**Exemple :**
```typescript
otterlogs.debug("Valeur de la variable : " + JSON.stringify(data));
otterlogs.debug("Étape 3/5 du processus d'initialisation");
```

---

### `otterlogs.silentlog(message)`

Log **silencieux**, console uniquement sans webhook.

**Caractéristiques :**
- Type : `debug` (Pino)
- Webhook : Non
- Utilisation : Pour les logs internes non critiques

**Exemple :**
```typescript
otterlogs.silentlog("Ping interne reçu");
```

---

## Configuration

### Variables d'Environnement (.env)

#### Environnement
```env
NODE_ENV=dev
```
- `dev` : Affiche les logs de debug et utilise un format de timestamp court
- `production` : Format de timestamp complet avec date

#### Webhooks Discord

**Webhook Global** (pour success, log, warn, important)
```env
GLOBAL_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

**Webhook Erreurs** (pour error)
```env
ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

#### Activation/Désactivation par Type

Contrôlez finement quels types de logs sont envoyés sur Discord :

```env
ENABLE_DISCORD_SUCCESS=true
ENABLE_DISCORD_LOGS=true
ENABLE_DISCORD_WARNS=true
ENABLE_DISCORD_ERRORS=true
```

Mettez à `false` pour désactiver l'envoi Discord d'un type spécifique.

---

## Fonctionnement Interne

### Format des Timestamps

- **Développement** : `HH:MM:ss` (ex: `14:32:05`)
- **Production** : `dd-mm-yyyy HH:MM:ss` (ex: `25-11-2024 14:32:05`)

### Champ `type`

En mode développement, un champ `type` est ajouté aux logs pour faciliter le débogage :
```json
{"type":"success"}
```

### Envoi des Webhooks

Chaque log (sauf `debug` et `silentlog`) déclenche l'envoi d'un message Discord si le webhook est activé avec :
- **Username** : `{BOT_NAME} - {TYPE}` (ex: "Otterbots - SUCCESS")
- **Content** : Le message du log

---

## Bonnes Pratiques

### Quand utiliser chaque niveau ?

| Niveau | Utilisation |
|--------|-------------|
| `success` | Opération importante réussie (démarrage, connexion DB, commande exécutée) |
| `log` | Événement informatif normal (chargement, action utilisateur) |
| `warn` | Situation anormale mais récupérable (retry, cache manquant) |
| `error` | Erreur critique nécessitant une intervention (crash, connexion échouée) |
| `important` | Information cruciale pour les admins (maintenance, mise à jour) |
| `debug` | Informations de débogage détaillées (variables, étapes internes) |
| `silentlog` | Logs internes non critiques (pings, heartbeats) |

### Exemple d'utilisation complète

```typescript
import { otterlogs } from "./otterbots/utils/otterlogs";

async function initializeBot() {
    otterlogs.log("Démarrage du bot...");
    
    try {
        await connectDatabase();
        otterlogs.success("Base de données connectée");
        
        const commands = await loadCommands();
        otterlogs.log(`${commands.length} commandes chargées`);
        
        if (commands.length === 0) {
            otterlogs.warn("Aucune commande trouvée !");
        }
        
        otterlogs.debug("Configuration : " + JSON.stringify(config));
        otterlogs.important("Bot prêt à l'emploi !");
        
    } catch (error) {
        otterlogs.error(`Échec de l'initialisation : ${error.message}`);
        process.exit(1);
    }
}
```

---

## Dépannage

### Les logs ne s'affichent pas en couleur
Vérifiez que votre terminal supporte les couleurs ANSI. Pino-pretty gère cela automatiquement.

### Les webhooks ne sont pas envoyés
1. Vérifiez que `GLOBAL_WEBHOOK_URL` et `ERROR_WEBHOOK_URL` sont définis
2. Vérifiez que `ENABLE_DISCORD_*` est à `true` pour le type concerné
3. Vérifiez les permissions du webhook sur Discord

### Les logs de debug n'apparaissent pas
Assurez-vous que `NODE_ENV=dev` est défini dans votre `.env`.
