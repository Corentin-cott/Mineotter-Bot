import { StringSelectMenuInteraction } from "discord.js";
import otterlogs from "../utils/otterlogs";
import launchServer from "./handleServerActions/handleServerLaunch";
import showServerInfo from "./handleServerActions/handleShowServerInfos";
import {ServeurType} from "../types/otterly";
import {fetchServerById} from "../services/api/otterlyapi";

export default async function handleServerSelect(interaction: StringSelectMenuInteraction) {
    // deferReply permet de faire durer l'interaction afin que le bot ait le temps d'effectuer de longues actions (ex : fermer le serveur)
    await interaction.deferUpdate();
    
    try {
        const [selectedServerId, action, utilisateurId] = interaction.values[0]?.split('|') ?? [];

        if (!selectedServerId || !action || !utilisateurId) {
            return interaction.editReply({ content: process.env.ERROR_MESSAGE });
        }
        if (interaction.user.id !== utilisateurId) {
            return interaction.editReply({ content: "Cette sélection ne t'appartient pas !" });
        }

        let serveur: ServeurType;
        try {
            serveur = await fetchServerById(parseInt(selectedServerId));
        } catch (err) {
            otterlogs.error(`Erreur Otterly API : ${err}`);
            return interaction.editReply({ content: process.env.ERROR_MESSAGE });
        }

        switch (action) {
            case "lancer":
                return await launchServer(interaction, serveur);
            case "infos":
                return await showServerInfo(interaction, serveur);
            default:
                return interaction.editReply({ content: process.env.ERROR_MESSAGE });
        }
    } catch (err) {
        otterlogs.error(`Erreur dans handleServerSelect : ${err}`);
        return interaction.editReply({ content: process.env.ERROR_MESSAGE, embeds: [], components: []})
    }
}
