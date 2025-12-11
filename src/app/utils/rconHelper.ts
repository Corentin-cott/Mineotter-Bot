import { otterlogs } from "../../otterbots/utils/otterlogs";
import { Rcon } from "rcon-client";
import { RconConfig } from "../types/rconTypes"

export const rconHelper = {
    /**
     * Connects to a Minecraft server with Rcon, sends a command, logs the response, and disconnects.
     * @param config - The RCON connection details (host, port, password)
     * @param command - The actual Minecraft command (e.g., "say Hello")
     * @returns The response from the server if it gives one.
     */
    async sendCommand(config: RconConfig, command: string): Promise<string | null> {
        // Input validation
        if (!command || command.trim() === "") {
            otterlogs.warn(`Attempted to send empty command.`);
            return null;
        }

        const rcon = new Rcon({
            host: config.host,
            port: config.port,
            password: config.password,
            timeout: config.timeout
        });

        try {
            // Connect
            await rcon.connect();

            // Send Command
            const response = await rcon.send(command);

            // Disconnect immediately to free resources
            await rcon.end();

            return response;

        } catch (error) {
            otterlogs.error(`Error sending command to ${config.host}: ${error}`);

            // Ensure connection is closed even if an error occurs
            try { await rcon.end(); } catch (e) {
                console.warn("Rcon : " + e);
            }

            return null;
        }
    }
};