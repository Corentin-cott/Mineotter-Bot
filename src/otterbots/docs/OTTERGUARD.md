# Otterguard - Module de Sécurité

Otterguard est le système de protection intégré au bot Otterbots. Il protège le serveur contre diverses menaces comme le spam, les liens malveillants et les arnaques.

## Initialisation (`otterguard.ts`)

### `otterbots_otterguard(client)`

Fonction principale qui initialise les modules de protection activés dans la configuration.

**Fonctionnement :**
1. Vérifie la configuration globale (`otterguardConfig`).
2. Active les modules demandés :
   - `protectLink` : Protection contre les liens interdits.
   - `protectScam` : Protection contre les messages d'arnaque connus.
   - `protectSpam` : Protection contre le flood et le spam.
3. Log l'état de chaque module.

**Exemple :**
```typescript
otterbots_otterguard(client);
```

---

## Utilitaires (`embed.ts`)

### `otterguard_Embed(title, messageContent)`

Crée un objet `EmbedBuilder` standardisé pour les notifications de sécurité Otterguard.

**Paramètres :**
- `title` (string) : Le titre de l'alerte (sera préfixé par "Otterguard: ").
- `messageContent` (string) : Le corps du message.

**Retour :**
- `EmbedBuilder` : Un embed Discord prêt à être envoyé, avec la couleur bleue (`0x0099FF`), un timestamp et un footer "Otterguard".

**Exemple :**
```typescript
const alert = otterguard_Embed("Lien interdit", "L'utilisateur X a posté un lien suspect.");
channel.send({ embeds: [alert] });
```

---

## Configuration (`app/config/otterguardConfig.ts`)

Otterguard est configurable via deux exports principaux :

1.  **`otterguardConfig`** : Active ou désactive les modules.
    ```typescript
    export const otterguardConfig = {
        protectLink: true, // Protection contre les liens
        protectScam: true, // Protection anti-scam
        protectSpam: true, // Protection anti-spam
    };
    ```

2.  **`authorizedDomains`** : Liste blanche des domaines autorisés (si `protectLink` est actif).
    ```typescript
    export const authorizedDomains = [
        "https://discord.com",
        "https://youtube.com",
        // ... autres domaines
    ];
    ```
