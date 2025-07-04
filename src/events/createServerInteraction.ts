import { Events, Interaction, EmbedBuilder, ColorResolvable, ButtonBuilder, ActionRowBuilder, ButtonStyle, TextChannel } from "discord.js";
import { BotEvent } from "../types";
import otterlogs from "../utils/otterlogs";

const event: BotEvent = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: Interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'start_setup') {
            let channel;
            if (interaction.channel != null) {
                channel = interaction.channel as TextChannel;
            } else {
                await interaction.reply({
                    content: "❌ Une erreur s'est produite avec le salon en traitant ta demande.",
                    ephemeral: true,
                });
                return;
            }
            let bot_color: string;
            bot_color = process.env.BOT_COLOR || "#FFFFFF";
            otterlogs.warn(`Le bot_color est ${bot_color}`);

            /* Questions à poser pour la configuration du serveur
            serveur_pack_url?: string;
            ou
            modpack_url?: string;

            modpack_name?: string;
            version: string;
            serveur_loader?: string;
            embed_color?: string;
            */

            try {
                try {
                    await interaction.deferReply({ ephemeral: true });
                } catch (error) {
                    otterlogs.error(`Erreur lors du "deferReply" : ${error}`);
                    await interaction.reply({
                        content: "❌ Une erreur s'est produite en traitant ta demande.",
                        ephemeral: true,
                    });
                    return;
                }

                /*
                let questionEmbed = new EmbedBuilder()
                let row = new ActionRowBuilder<ButtonBuilder>();

                try {
                    questionEmbed
                    .setTitle("Étape 1/6 : Utilisation d'un serveur pack ?")
                    .setDescription(``)
                    .setColor(bot_color as ColorResolvable)
                    .setFooter({
                        text: "Mineotter",
                        iconURL: interaction.client.user?.displayAvatarURL() || '',
                    })
                    .setTimestamp();

                    const yesButton = new ButtonBuilder()
                        .setCustomId('yesButton')
                        .setLabel('Oui')
                        .setStyle(ButtonStyle.Success);
                    const noButton = new ButtonBuilder()
                        .setCustomId('noButton')
                        .setLabel('No')
                        .setStyle(ButtonStyle.Danger);

                    row.addComponents(yesButton, noButton);
                } catch (error) {
                    otterlogs.error(`Erreur lors de la création du message : ${error}`);
                    await interaction.editReply({
                        content: "❌ Une erreur s'est produite en traitant ta demande."
                    });
                    return;
                }
    
                try {
                    await channel.send({
                        embeds: [questionEmbed],
                        components: [row.toJSON()]
                    });
                } catch (error) {
                    otterlogs.error(`Erreur lors de l'envoi du message dans le salon de création : ${error}`);
                    await interaction.editReply({
                        content: "❌ Une erreur s'est produite en traitant ta demande."
                    });
                    return;
                }
                */

                await interaction.editReply({
                    content: "Désolé, pas encore prêt !"
                });
            } catch (error) {
                otterlogs.error(`Erreur lors du clic sur le bouton Commencer : ${error}`);
                await interaction.editReply({
                    content: "❌ Une erreur s'est produite en traitant ta demande." + error
                });
            }
        }
    }
};

export default event;
