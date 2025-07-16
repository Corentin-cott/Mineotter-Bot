import { Client, REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import otterlogs from "../utils/otterlogs";
import { SlashCommand } from "../types";

export default async function loadCommands(client: Client) {
    const commandsPath = path.resolve(__dirname, "../slashCommands");
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    const body = [];

    const loadedCommands: string[] = [];
    const failedCommands: { file: string; error: string }[] = [];
    const commandNames = new Set();

    for (const file of commandFiles) {
        try {
            const { command }: { command: SlashCommand } = require(`${commandsPath}/${file}`);

            if (!command?.data) {
                failedCommands.push({ file, error: "Pas de propriété 'data'" });
                continue;
            }

            if (commandNames.has(command.name)) {
                failedCommands.push({ file, error: `Commande "${command.name}" déjà chargée.` });
                continue;
            }

            commandNames.add(command.name);

            body.push(command.data.toJSON());
            client.slashCommands.set(command.name, command);
            loadedCommands.push(command.name);
        } catch (error) {
            failedCommands.push({ file, error: String(error) });
        }
    }

    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

    try {
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), { body });

        otterlogs.success(`${loadedCommands.length} commandes chargées : ${loadedCommands.join(', ')}`);

        if (failedCommands.length > 0) {
            otterlogs.warn(`${failedCommands.length} commandes non chargées :`);
            failedCommands.forEach(({ file, error }) => {
                otterlogs.warn(`- ${file} : ${error}`);
            });
        } else {
            otterlogs.log("0 commandes non chargées");
        }
    } catch (error) {
        otterlogs.error(`Erreur lors de l'envoi des commandes à l'API Discord : ${error}`);
    }
}
