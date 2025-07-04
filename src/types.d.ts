import { Collection, CommandInteraction, SlashCommandBuilder } from "discord.js";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN: string;
            DISCORD_CLIENT_ID: string;
            DEV_SERVEUR: string;
            BOT_COLOR: string;
            VERSION: string;
            
            GUILD_ID: string;
            CATEGORY_NAME: string;
            ROLE_NAME: string;
            
            DB_HOST: string;
            DB_USER: string;
            DB_PORT: number;
            DB_PASSWORD: string;
            DB_NAME: string;

        }
    }
}

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>
    }
}

export interface Channel {
    name: string,
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args: any) => void
}

export interface I_Utilisateurs_discord {
    discord_id: string,
    pseudo_discord: string,
    join_date_discord: string,
}

export interface SlashCommand {
    name: string,
    data: SlashCommandBuilder | any,
    async execute: (interaction: CommandInteraction) => Promise<void>
    async execute?: (interaction: CommandInteraction) => Promise<void>
    async autocomplete?: (interaction: CommandInteraction) => Promise<void>
}

export { };