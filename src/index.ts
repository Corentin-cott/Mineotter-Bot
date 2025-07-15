import { Client, Collection, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { SlashCommand } from "./types";
import otterlogs from "./utils/otterlogs";

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

otterlogs.silentlog(
    " __  __                         _    _              \n" +
    "|  \\/  |( ) _ __    ___   ___  | |_ | |_  ___  _ __ \n" +
    "| |\\/| || || '_ \\  / _ \\ /   \\ | __|| __|/ _ \\| '__|\n" +
    "| |  | || || | | ||  __/| ( ) || |_ | |_|  __/| |   \n" +
    "|_|  |_||_||_| |_| \\___| \\___/  \\__| \\__|\\___||_|   \n" +
    "- fait pour l'Antre des Loutres\n"
)
// ASCII art made with https://www.asciiart.eu/text-to-ascii-art

try {
    client.slashCommands = new Collection<string, SlashCommand>();

    const handlersDirs = join(__dirname, "./handlers/command-event");

    readdirSync(handlersDirs).forEach(file => {
        require(`${handlersDirs}/${file}`)(client)
    })

} catch (error) {
    otterlogs.error(`Erreur lors du chargement des commandes et des events : ${error}`);
}

client.login(process.env.DISCORD_TOKEN);

