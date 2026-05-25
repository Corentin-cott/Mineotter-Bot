import {
    ButtonInteraction,
    EmbedBuilder,
    Interaction,
    PermissionFlagsBits,
} from "discord.js";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import {
    createScreenshotRecord,
    findDiscordUserRecordId,
    MessageRef,
    parseCustomId,
    parseMessageRef,
    REFUSE_PREFIX,
    REFUSED_COLOR,
    REFUSED_EMOJI,
    updateSubmissionStatus,
    VALIDATE_PREFIX,
    VALIDATED_COLOR,
    VALIDATED_EMOJI,
} from "../utils/screenshotHelper";

const STRINGS = {
    notModerator: "Cette action est réservée aux modérateurs.",
    invalidButton: "Bouton invalide ou expiré.",
    missingImage: "Impossible de retrouver l'image de cette soumission.",
    saveFailed: "Échec de l'enregistrement du screenshot. Réessaie plus tard.",
    validated: "Screenshot validé et ajouté à la galerie ✅",
    refused: "Screenshot refusé ❌",
    titleField: "Titre",
    statusField: "Statut",
    validatedBy: (id: string) => `${VALIDATED_EMOJI} Validée par <@${id}>`,
    refusedBy: (id: string) => `${REFUSED_EMOJI} Refusée par <@${id}>`,
    submissionValidated: `${VALIDATED_EMOJI} Validée`,
    submissionRefused: `${REFUSED_EMOJI} Refusée`,
    defaultName: (author: string) => `Screenshot de ${author}`,
};

async function handleValidate(
    interaction: ButtonInteraction,
    serverId: string,
    platformId: string,
    authorId: string,
    submissionRef: MessageRef | undefined,
): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const embed = interaction.message.embeds[0];
    const imageUrl = embed?.image?.url;
    if (!imageUrl) {
        await interaction.editReply(STRINGS.missingImage);
        return;
    }

    const titleField = embed?.fields.find(f => f.name === STRINGS.titleField);
    const authorName = embed?.author?.name ?? authorId;
    const name = titleField?.value || STRINGS.defaultName(authorName);

    const discordUserRecordId = await findDiscordUserRecordId(authorId);

    try {
        await createScreenshotRecord({ name, serverId, platformId, discordUserRecordId, imageUrl });
    } catch (error) {
        otterlogs.error(`screenshot: failed to create record: ${error}`);
        await interaction.editReply(STRINGS.saveFailed);
        return;
    }

    if (submissionRef) {
        await updateSubmissionStatus(interaction.client, submissionRef, VALIDATED_EMOJI, STRINGS.submissionValidated);
    }

    if (embed) {
        const updated = EmbedBuilder.from(embed)
            .setColor(VALIDATED_COLOR)
            .addFields({ name: STRINGS.statusField, value: STRINGS.validatedBy(interaction.user.id) });
        await interaction.message.edit({ embeds: [updated], components: [] }).catch(() => undefined);
    }

    otterlogs.success(`screenshot validated by ${interaction.user.tag} (author=${authorId})`);
    await interaction.editReply(STRINGS.validated);
}

async function handleRefuse(
    interaction: ButtonInteraction,
    submissionRef: MessageRef | undefined,
): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    if (submissionRef) {
        await updateSubmissionStatus(interaction.client, submissionRef, REFUSED_EMOJI, STRINGS.submissionRefused);
    }

    const embed = interaction.message.embeds[0];
    if (embed) {
        const updated = EmbedBuilder.from(embed)
            .setColor(REFUSED_COLOR)
            .addFields({ name: STRINGS.statusField, value: STRINGS.refusedBy(interaction.user.id) });
        await interaction.message.edit({ embeds: [updated], components: [] }).catch(() => undefined);
    }

    otterlogs.debug(`screenshot refused by ${interaction.user.tag}`);
    await interaction.editReply(STRINGS.refused);
}

module.exports = {
    name: "interactionCreate",
    once: false,
    async execute(interaction: Interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith(VALIDATE_PREFIX) && !interaction.customId.startsWith(REFUSE_PREFIX)) return;

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
            await interaction.reply({ content: STRINGS.notModerator, ephemeral: true });
            return;
        }

        const parsed = parseCustomId(interaction.customId);
        if (!parsed) {
            await interaction.reply({ content: STRINGS.invalidButton, ephemeral: true });
            return;
        }

        const submissionRef = parseMessageRef(interaction.message.embeds[0]?.url);

        if (parsed.action === "validate") {
            await handleValidate(interaction, parsed.serverId, parsed.platformId, parsed.authorId, submissionRef);
        } else {
            await handleRefuse(interaction, submissionRef);
        }
    },
};
