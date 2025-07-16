import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { BotEvent } from "../types";
import otterlogs from "../utils/otterlogs";

module.exports = (client: Client) => {
    let eventsDir = join(__dirname, "../events");

    const loadedEvents: string[] = [];
    const failedEvents: { file: string; error: string }[] = [];

    readdirSync(eventsDir).forEach(file => {
        if (!file.endsWith(".js")) return;

        try {
            const event: BotEvent = require(`${eventsDir}/${file}`).default;

            event.once
                ? client.once(event.name, (...args) => event.execute(...args))
                : client.on(event.name, (...args) => event.execute(...args))

            loadedEvents.push(file);
        } catch (error) {
            failedEvents.push({ file, error: String(error) });
        }
    })

    otterlogs.success(`${loadedEvents.length} events chargées : ${loadedEvents.join(', ')}`);

    if (failedEvents.length > 0) {
        otterlogs.warn(`${failedEvents.length} events non chargées :`);
        failedEvents.forEach(({ file, error }) => {
            otterlogs.error(`- ${file} : ${error}`);
        });
    } else {
        otterlogs.log("0 events non chargées");
    }
}