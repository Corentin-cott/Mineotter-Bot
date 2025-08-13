import { Client } from "discord.js";
import otterlogs from "../utils/otterlogs";

export async function task(client : Client, guildId : string) {

    setInterval(async () => {
        otterlogs.log("La c'est le moment ou je fais un truc. Mais j'ai rien à faire pour l'instant. Donc je vais juste attendre 24h avant de recommencer.");
    }, 1000 * 60 * 60 * 24); // Chaque jour à 00:00:00

}