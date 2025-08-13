import { StringSelectMenuInteraction } from "discord.js";
import buildServerEmbed from "../../utils/buildServerEmbed";
import { ServeurType } from "../../types/otterly";

export default async function showServerInfo(interaction: StringSelectMenuInteraction, serveur: ServeurType) {
    return interaction.editReply({
        embeds: [buildServerEmbed(interaction, serveur, "infos")],
    });
}
