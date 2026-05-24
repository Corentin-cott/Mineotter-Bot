import { otterlogs } from "../../otterbots/utils/otterlogs";
import { getSalonByAlias } from "../../otterbots/utils/salon";
import { fetchAllActiveServers } from "../utils/serverHelper";
import { rconHelper, RCON_TIMEOUT_MS } from "../utils/rconHelper";
import { cleanUserMessage } from "../utils/discordMessageCleaner";
import { RconConfig } from "../types/rconTypes";
import { Message } from "discord.js";

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message: Message) {
        // Ignore bots
        if (message.author.bot) return;

        const targetChannel = getSalonByAlias("discu-mc")
        if (!targetChannel) return;

        const targetChannelId: string = targetChannel.id

        if (message.channel.id === targetChannelId) {
            otterlogs.debug(`Message from ${message.author.tag}: ${message.content}`);

            // Construction of the tellraw command
            const cleanMessage = cleanUserMessage(message);
            const tellrawObject = ["", { text: "<" }, { text: message.author.username, color: "#7289DA", hoverEvent: { action: "show_text", contents: "Message provenant de Discord" } }, { text: `> ${cleanMessage}` }];

            // JSON.stringify ensures safe escaping of special characters
            const command: string = `/tellraw @a ${JSON.stringify(tellrawObject)}`;

            try {
                // Fetch active servers (RCON targets) from PocketBase
                const servers = await fetchAllActiveServers();
                otterlogs.debug(`Active servers: ${JSON.stringify(servers)}`);

                await Promise.all(servers.map(async (server) => {
                    const rcon: RconConfig = {
                        host: server.rcon_host,
                        port: parseInt(server.rcon_port),
                        password: server.rcon_password,
                        timeout: RCON_TIMEOUT_MS
                    };

                    try {
                        const result = await rconHelper.sendCommand(rcon, command);
                        if (result != null && result.length > 0) {
                            otterlogs.debug(`[${server.host}] RCON Response: ${result}`);
                        }
                    } catch (rconError) {
                        otterlogs.error(`[${server.host}] RCON Failed: ${rconError}`);
                    }
                }));
            } catch (error) {
                otterlogs.error(`Failed to fetch servers or send messages: ${error}`);
            }
        }
    }
};