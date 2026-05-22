# OtterHealthCheck - Endpoint de santé HTTP

OtterHealthCheck est une utilité légère qui expose un endpoint HTTP `/healthcheck`. Cela permet à des outils de monitoring externes (comme Uptime Kuma, Better Stack, etc.) de vérifier que le bot est en ligne et fonctionnel.

## Configuration

Vous pouvez configurer le port sur lequel le serveur écoute via le fichier `.env` :

```env
HEALTHCHECK_PORT=3000
```

Si aucune variable n'est définie, le port par défaut est **3000**.

## Fonctionnement

Le serveur est démarré automatiquement dans `src/app/index.ts` via la méthode :

```typescript
OtterHealthCheck.start(bot.getClient());
```

### Endpoint `/healthcheck`

Une requête `GET` sur `http://votre-domaine:PORT/healthcheck` renverra un statut **200 OK** avec un corps JSON structuré selon les standards :

```json
{
  "status": "UP",
  "name": "MonSuperBot",
  "version": "1.0.0",
  "timestamp": "2026-05-22T03:30:00.000Z",
  "uptime": {
    "seconds": 3665,
    "human": "1h 1m 5s"
  },
  "discord": {
    "ping": 42
  },
  "resources": {
    "memory": {
      "rss": "120 MB",
      "heapUsed": "45 MB",
      "heapTotal": "60 MB"
    }
  }
}
```

- `status`: État global du bot (`UP` ou `DOWN`).
- `name`: Nom du bot défini dans le `.env`.
- `uptime`: Temps de fonctionnement (en secondes et format lisible).
- `discord`: Informations liées à la connexion Discord (ping).
- `resources`: Utilisation de la mémoire système.

## Utilisation avancée

Si vous avez besoin d'arrêter le serveur manuellement :

```typescript
OtterHealthCheck.stop();
```
