import {CommandInteraction, StringSelectMenuInteraction} from "discord.js";
import {ServeurType} from "../types/otterly";
import {fetchPrimaryServer, fetchSecondaryServer, fetchServerById} from "../services/api/otterlyapi";
import otterlogs from "../utils/otterlogs";

export default async function showServerCheck(interaction: CommandInteraction) {
    let serveurPrimaire: ServeurType | null;
    let serveurSecondaire: ServeurType | null;
    try {
        serveurPrimaire = await fetchPrimaryServer();
    } catch (err) {
        otterlogs.error(`Erreur Otterly API : ${err}`);
        return interaction.reply({ content: process.env.ERROR_MESSAGE });
    }
    try {
        serveurSecondaire = await fetchSecondaryServer();
    } catch (err) {
        otterlogs.error(`Erreur Otterly API : ${err}`);
        return interaction.reply({ content: process.env.ERROR_MESSAGE });
    }
    if (serveurPrimaire === null || serveurSecondaire === null) {
        otterlogs.error("Soit le serveur primaire ou le serveur secondaire renvoyé par l'API est null");
        return interaction.reply({ content: process.env.ERROR_MESSAGE });
    }

    let primairePlayerCount: number;
    let secondairePlayerCount: number;
}