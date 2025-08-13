import { CommandInteraction } from "discord.js";
import { ServeurType } from "../types/otterly";
import { fetchPrimaryAndSecondaryServers } from "../services/api/otterlyapi";
import otterlogs from "../utils/otterlogs";
import { buildServerCheckEmbed } from "../utils/buildServerEmbed";

export default async function showServerCheck(interaction: CommandInteraction) {
    try {
        const { primary, secondary } = await fetchPrimaryAndSecondaryServers();

        return interaction.reply({
            embeds: [buildServerCheckEmbed(interaction, primary, secondary)],
            content: "Voici nos serveurs actuellement ouverts !",
            components: [],
        });
    } catch (err) {
        otterlogs.error(`Erreur Otterly API : ${err}`);
        return interaction.reply({
            content: process.env.ERROR_MESSAGE || "Une erreur est survenue lors de la récupération des serveurs.",
            ephemeral: true,
        });
    }
}
