const { MessageFlags } = require('discord.js');
const colorConsole = require(__dirname + '/../utils/colorConsole.js');

module.exports = {
  name: 'interactionCreate',
  execute: async (interaction, client) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      colorConsole.warn(`Commande inconnue : "${colorConsole.important(interaction.commandName)}"`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      colorConsole.error(`Erreur lors de l'interaction de la commande : "${colorConsole.errorImportant(error)}"`);
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'exécution de cette commande.',
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
