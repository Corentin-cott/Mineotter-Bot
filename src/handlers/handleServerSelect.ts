import { StringSelectMenuInteraction } from "discord.js";
import otterlogs from "../utils/otterlogs";
import launchServer from "./handleServerActions/handleServerLaunch";
import showServerInfo from "./handleServerActions/handleShowServerInfos";
import {ServeurType} from "../types/otterly";
import {fetchServerById} from "../services/api/otterlyapi";

export default async function handleServerSelect(interaction: StringSelectMenuInteraction) {
    try {
        const [selectedServerId, action, utilisateurId] = interaction.values[0]?.split('|') ?? [];

        if (!selectedServerId || !action || !utilisateurId) {
            return interaction.reply({ content: process.env.ERROR_MESSAGE });
        }
        if (interaction.user.id !== utilisateurId) {
            return interaction.reply({ content: "Cette sélection ne t'appartient pas !", ephemeral: true });
        }

        let serveur: ServeurType;
        try {
            serveur = await fetchServerById(parseInt(selectedServerId));
        } catch (err) {
            otterlogs.error(`Erreur Otterly API : ${err}`);
            return interaction.reply({ content: process.env.ERROR_MESSAGE });
        }

        switch (action) {
            case "lancer":
                return await launchServer(interaction, serveur);
            case "infos":
                return await showServerInfo(interaction, serveur);
            default:
                return interaction.reply({ content: process.env.ERROR_MESSAGE });
        }
    } catch (err) {
        otterlogs.error(`Erreur dans handleServerSelect : ${err}`);
        return interaction.reply({ content: process.env.ERROR_MESSAGE });
    }
}
