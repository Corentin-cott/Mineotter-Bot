import {CommandInteraction, StringSelectMenuInteraction} from "discord.js";
import { ServeurType } from "../types/otterly";
import getEmojiByName from "../utils/getBotEmoji"
type EmbedType = 'infos' | 'démarré' | 'déjà démarré' | 'arrêté';

export default function buildServerEmbed(
    interaction: StringSelectMenuInteraction,
    serveur: ServeurType,
    type: EmbedType
) {
    const nomServeur = serveur.nom?.trim() || "Inconnu";

    const title: string =
        type === 'démarré' ? `Serveur ${serveur.nom} démarré` :
            type === 'arrêté' ? `Serveur ${serveur.nom} arrêté` :
                type === 'déjà démarré' ? `Serveur ${serveur.nom} déjà actif` :
                    `Informations sur le serveur ${serveur.nom}`;

    const descriptionFallBack: string =
        type === 'démarré'
            ? `Le serveur ${serveur.nom} a été démarré avec succès.`
            : type === 'déjà démarré'
                ? `Le serveur ${serveur.nom} était déjà en cours d'exécution.`
                : `Voici les informations sur le serveur ${serveur.nom}.`;

    const description: string =
            serveur.description && serveur.description !== "NA" ? serveur.description : descriptionFallBack ;

    const color = parseInt(serveur.embed_color.replace("#", ""), 16);

    const isDev: boolean = process.env.ENVIRONNEMENT === "DEV";
    const emojiMcvan: string = getEmojiByName("mc_van", isDev)

    return {
        title,
        description,
        color,
        fields: [
            { name: `${emojiMcvan} Jeu`, value: serveur.jeu || "Non spécifié", inline: true },
            { name: "📦 Version", value: serveur.version || "Non spécifiée", inline: true },
            {
                name: "🦦 Modpack",
                value: serveur.modpack && serveur.modpack_url
                    ? `[${serveur.modpack}](${serveur.modpack_url})`
                    : "Aucun modpack",
                inline: true,
            },
        ],
        image: serveur.image ? { url: serveur.image } : { url: "https://thumb.canalplus.pro/http/unsafe/1920x1080/smart/creativemedia-image.canalplus.pro/content/0001/40/97e6a76d9788e3e0eea6fddbd68b4fb8b8d5cdda.jpeg"},
        footer: {
            text: "Mineotter",
            icon_url: interaction.user?.displayAvatarURL() || undefined,
        },
        timestamp: new Date().toISOString(),
    };
}

export function buildServerCheckEmbed(
    interaction: CommandInteraction | StringSelectMenuInteraction,
    primary: ServeurType,
    secondary: ServeurType
) {
    const isDev: boolean = process.env.ENVIRONNEMENT === "DEV";
    const emojiMcvan: string = getEmojiByName("mc_van", isDev);
    const emojiMcmod: string = getEmojiByName("mc_mod", isDev);

    return {
        title: "État des serveurs Minecraft",
        description: "Voici les informations sur les deux serveurs principaux de l'Antre des Loutres.",
        color: parseInt(process.env.BOT_COLOR.replace("#", ""), 16),
        fields: [
            {
                name: `${emojiMcvan} ${primary.nom} (${primary.type === "primary" ? "Principal" : "Secondaire"})`,
                value:
                    `**Jeu** : ${primary.jeu || "Non spécifié"}\n` +
                    `**Version** : ${primary.version || "Non spécifiée"}\n` +
                    `**Modpack** : ${primary.modpack && primary.modpack_url ? `[${primary.modpack}](${primary.modpack_url})` : "Aucun"}\n` +
                    `**Joueurs connectés** : ${primary.players_online ?? 0}`,
                inline: false,
            },
            {
                name: `${emojiMcmod} ${secondary.nom} (${secondary.type === "secondary" ? "Secondaire" : "Principal"})`,
                value:
                    `**Jeu** : ${secondary.jeu || "Non spécifié"}\n` +
                    `**Version** : ${secondary.version || "Non spécifiée"}\n` +
                    `**Modpack** : ${secondary.modpack && secondary.modpack_url ? `[${secondary.modpack}](${secondary.modpack_url})` : "Aucun"}\n` +
                    `**Joueurs connectés** : ${secondary.players_online ?? 0}`,
                inline: false,
            },
        ],
        footer: {
            text: "Mineotter",
            icon_url: interaction.user?.displayAvatarURL() || "https://thumb.canalplus.pro/http/unsafe/1920x1080/smart/creativemedia-image.canalplus.pro/content/0001/40/97e6a76d9788e3e0eea6fddbd68b4fb8b8d5cdda.jpeg",
        },
        timestamp: new Date().toISOString(),
    };
}
