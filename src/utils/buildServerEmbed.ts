import { StringSelectMenuInteraction } from "discord.js";
import { ServeurType } from "../types/otterly";
import getEmojiByName from "../utils/getBotEmoji"
type EmbedType = 'infos' | 'démarré' | 'déjà démarré' | 'arrêté';

export default function buildServerEmbed(
    interaction: StringSelectMenuInteraction,
    serveur: ServeurType,
    type: EmbedType
) {
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
            icon_url: interaction.user?.displayAvatarURL() || "",
        },
        timestamp: new Date().toISOString(),
    };
}
