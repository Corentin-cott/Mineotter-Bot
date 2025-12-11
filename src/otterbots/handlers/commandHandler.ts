import { Client, Collection, REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { SlashCommand } from "../types";
import { otterlogs } from "../utils/otterlogs";

/**
 * Load all commands from the commands folder
 * @param client
 */
export async function otterBots_loadCommands(client: Client): Promise<void> {
    client.on("ready", async () => {
        const rootDir = path.join(__dirname, "..");
        const commandsPath = path.join(rootDir, "commands");
        const additionalPath = path.join(rootDir, "../app/commands/");

        let commandFiles: string[] = [];

        try {
            commandFiles = [
                ...getAllCommandFiles(commandsPath),
                ...getAllCommandFiles(additionalPath)
            ];
            otterlogs.log(`Found ${commandFiles.length} command file(s).`);
            commandFiles.forEach(f => otterlogs.log(`- ${f}`));
        } catch (error) {
            otterlogs.warn("Commands folder not found, continuing..." + error);
            return;
        }

        try {
            client.slashCommands = new Collection<string, SlashCommand>();
            const commandsData = [];

            for (const file of commandFiles) {
                if (file.endsWith(".d.ts")) continue;

                const fileUrl = pathToFileURL(file).href;
                const imported = await import(fileUrl);

                const command = resolveCommand(imported);

                // ⚠️ TypeScript type guard
                if (!isSlashCommand(command)) {
                    otterlogs.error("Command ignored:" + file + " -> " + command);
                    continue;
                }

                client.slashCommands.set(command.data.name, command);
                commandsData.push(command.data.toJSON());
                otterlogs.log(`Command registered: ${command.data.name}`);
            }
            // Send commands to Discord
            const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
                { body: commandsData }
            );

            otterlogs.success(`${commandsData.length} command(s) registered on Discord.`);
        } catch (error) {
            otterlogs.error("Error loading commands:" + error);
        }
    })
}

/**
 * Recursively retrieves all command files from a specified directory.
 * The method filters files based on their extension, which depends
 * on whether the build or source folder is currently in use (.js or .ts).
 *
 * @param {string} dir - The directory to search for command files.
 * @return {string[]} An array of file paths to all command files found within the directory.
 */
function getAllCommandFiles(dir: string): string[] {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const isBuild = __dirname.includes("build") || __dirname.includes("dist");
    const ext = isBuild ? ".js" : ".ts";

    return files.flatMap(file =>
        file.isDirectory()
            ? getAllCommandFiles(path.join(dir, file.name))
            : file.name.endsWith(ext)
                ? [path.join(dir, file.name)]
                : []
    );
}

/**
 * Resolves the default export of a module, if present, by traversing the `default` property chain.
 * @param {unknown} module - The module to resolve the command from. It can be any type.
 * @return {unknown} The resolved command or the original module if no `default` chain exists.
 */
function resolveCommand(module: unknown): unknown {
    let cmd: unknown = module;
    while (cmd && typeof cmd === "object" && "default" in cmd) {
        cmd = (cmd as { default: unknown }).default;
    }
    return cmd;
}

/**
 * Determines if the provided object is a valid SlashCommand.
 *
 * @param {unknown} command - The object to be verified as a SlashCommand.
 * @return {boolean} Returns `true` if the object conforms to the SlashCommand structure; otherwise, returns `false`.
 */
function isSlashCommand(command: unknown): command is SlashCommand {
    return (
        typeof command === "object" &&
        command !== null &&
        "data" in command &&
        "execute" in command &&
        typeof (command as SlashCommand).execute === "function"
    );
}