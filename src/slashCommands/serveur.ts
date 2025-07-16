import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, ColorResolvable, Interaction } from 'discord.js';
import { SlashCommand } from '../types';
import { ServeursDatabase } from "../database/serveursController";

export const command: SlashCommand = {
    name: 'serveur',
    data: new SlashCommandBuilder()
        .setName('serveur')
        .setDescription('Permet d\'interagir avec les serveurs Minecraft.')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action que vous souhaitez effectuer avec le serveur.')
                .setRequired(true)
                .addChoices(
                    { name: 'Lancer', value: 'lancer' },
                    { name: 'Check', value: 'check' },
                    { name: 'Informations', value: 'infos' }
                )
        ),
    execute: async (interaction: CommandInteraction) => {
        const action = interaction.options.get('action')?.value as string;
        const db = new ServeursDatabase();

        let embedTitle = "";
        if (action === 'check') {
            // Not implemented yet
            await interaction.reply({
                content: "Cette action n'est pas encore implémentée.",
                ephemeral: true
            });
            return;
        } else if (action === 'infos') {
            embedTitle = "Choisissez un serveur pour afficher ses informations";
        } else if (action === 'lancer') {
            embedTitle = "Choisissez un serveur à démarrer";
        }

        // Pour les autres actions, on va utiliser un select menu
        const serveursList = await db.getAllGlobalActifServeurs();
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('serveur_select')
            .setPlaceholder('Sélectionnez un serveur')
            .addOptions(
                serveursList.results.map(serveur => {
                    let isModdedText = "Serveur Moddé : Inconnu";
                    if (serveur.modpack && serveur.modpack.includes("Minecraft Vanilla")) {
                        isModdedText = "Serveur Vanilla";
                    } else {
                        isModdedText = "Serveur Moddé : " + serveur.modpack;
                    }

                    return {
                        label: serveur.nom,
                        value: `${serveur.id.toString()}|${action}|${interaction.user.id}`,
                        description: `${serveur.version} - ${isModdedText}`,
                    };
                })
            );
        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(selectMenu);
        const embed = new EmbedBuilder()
            .setTitle(embedTitle)
            .setDescription("Sélectionnez un serveur dans le menu déroulant ci-dessous.")
            .setColor(process.env.BOT_COLOR as ColorResolvable || "#FFFFFF")
            .setFooter({
                text: "Mineotter",
                iconURL: interaction.client.user?.displayAvatarURL() || '',
            })
            .setTimestamp();
        await interaction.reply({
            content: "Sélectionnez un serveur dans le menu déroulant ci-dessous.",
            embeds: [embed],
            components: [row]
        });
    }
};