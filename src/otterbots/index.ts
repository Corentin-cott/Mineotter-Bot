import {displayLogo} from "./utils/displayLogo";
import dotenv from 'dotenv';
import {clientGatewayIntent} from "../app/config/client";
import {Client} from "discord.js";
import {otterBots_loadCommands} from "./handlers/commandHandler";
import {otterBots_initSalon} from "./utils/salon";
import {otterBots_interactionCreate} from "./event/commandInteraction";
import {otterBots_clientReady} from "./event/clientReady";
import {otterBots_setActivity} from "./utils/activity";
import {otterBots_initEmoteReact} from "./event/emoteReact";
import {otterbots_purgeCommand} from "./handlers/purgeCommand";
import {otterbots_eventHandler} from "./handlers/eventHandler";
import {otterbots_otterguard} from "./utils/otterguard/otterguard";
import {otterbots_initTask} from "./utils/task";
import {Otterlyapi} from "./utils/otterlyapi/otterlyapi";
import {OtterHealthCheck} from "./utils/healthcheck/healthcheck";

dotenv.config()

/**
 * The `Otterbots` class is responsible for initializing and managing a bot client,
 * handling events such as ready state and interaction commands, and loading
 * command handlers for the bot.
 */
export class Otterbots {

    private client: Client;

    constructor(client?: Client) {
        this.client = client ?? clientGatewayIntent
    }

    // Lancement du bot
    public start() {
        displayLogo(process.env.BOT_NAME);

        this.client.login(process.env.BOT_TOKEN)

        // Évènement du bot
        this.clientReady()
        this.interactionCreate()

        // Start handlers
        this.commandHandler()
        this.eventHandler()

        // Command test
        this.testsCommands()

        // Start salons
        this.initSalons()

        // Start emote react
        this.initEmoteReact()

        // Init OtterlyApiModule
        this.initOtterlyApiModule()

        // Start health check server
        OtterHealthCheck.start(this.client);
    }

    public getClient() {
        return this.client
    }

    /**
     * Sets the activity status for the client.
     * @param {string} [activityType="playing"] - The type of activity ("playing", "streaming", "listening", "watching", "competing".).
     * @param {string} activity - The activity description to display.
     * @return {void} This method does not return a value.
     */
    public setActivity(activityType: string = "playing", activity: string): void {
        otterBots_setActivity(activityType, activity, this.client)
    }

    /**
     * Purges all commands from the specified client instance to reset or clean up command configurations.
     *
     * @param {Client} [client=this.client] - The client instance from which commands will be purged. If no client is provided, the default is the `this.client` instance.
     * @return {Promise<void>} - A promise that resolves when the command purging process has completed.
     */
     public async purgeCommand(client: Client = this.client): Promise<void> {
        await otterbots_purgeCommand(client)
    }

    /**
     * Initializes and starts the OtterGuard service using the provided client instance.
     *
     * @param {Client} [client=this.client] - The client instance to be used for the OtterGuard service. If not provided, defaults to the class-level client.
     * @return {Promise<void>} A promise that resolves when the OtterGuard service has started successfully.
     */
    public startOtterGuard(client: Client = this.client): void {
         otterbots_otterguard(client)
    }

    /**
     * Initializes a task by invoking the required internal setup function.
     *
     * @return {void} Does not return a value.
     */
    public initTask(): void {
        otterbots_initTask()
    }

    // Bot startup event
    private async clientReady(client: Client = this.client): Promise<void> {
        await otterBots_clientReady(client)
    }

    // Command handling event
    private async interactionCreate(client: Client = this.client): Promise<void> {
        await otterBots_interactionCreate(client)
    }

    // Command handlers
    private async commandHandler(client: Client = this.client): Promise<void> {
        await otterBots_loadCommands(client)
    }

    // Event handler
    private async eventHandler(client: Client = this.client): Promise<void> {
         await otterbots_eventHandler(client)
    }

    // Test commands
    private async testsCommands(client: Client = this.client): Promise<void> {
        this.client = client;
        // TODO : Mettre en place les commandes de test
    }

    // Initialisation des salons
    private async initSalons(client: Client = this.client): Promise<void> {
      await otterBots_initSalon(client)
    }

    // Initialize the emote react event
    private async initEmoteReact(client: Client = this.client): Promise<void> {
        await otterBots_initEmoteReact(client)
    }

    // Init OtterlyApiModule
    private initOtterlyApiModule(){
        const otterlyApiModule = new Otterlyapi()
        otterlyApiModule.init()
    }

}
