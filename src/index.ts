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

client.slashCommands = new Collection<string, SlashCommand>();
const loadersDirs = join(__dirname, "./loaders/");

try {
    readdirSync(loadersDirs).forEach(file => {
        const loader = require(`${loadersDirs}/${file}`);
        if (typeof loader === "function") {
            loader(client);
        } else if (loader && typeof loader.default === "function") {
            loader.default(client);
        } else {
            otterlogs.warn(`Le fichier "${file}" n'exporte pas une fonction valide.`);
        }
    });
} catch (error) {
    otterlogs.error(`Erreur lors du chargement des commandes et/ou des events : ${error}`);
}

client.login(process.env.DISCORD_TOKEN);

