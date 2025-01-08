const {REST, Routes} = require('discord.js');
const colorConsole = require(__dirname + '/../utils/colorConsole.js');
const fs = require('fs');
const path = require('path');
const {bot_token, bot_id} = require('../config.json');

// Initialisation de REST avec le token
const rest = new REST({version: '10'}).setToken(bot_token);

// Vérification de la connexion au bot
(async () => {
  try {
    await rest.get(Routes.applicationCommands(bot_id)); // Test pour vérifier la connexion
    colorConsole.success('Connexion au bot réussie.');
  } catch (error) {
    colorConsole.error(`Impossible de se connecter au bot : "${colorConsole.errorImportant(error)}"`);
  }
})();

// Préparation des commandes
const commands = [];
const commandsPath = path.join(__dirname, '../commands');
const commandFolders = fs.readdirSync(commandsPath);

// Chargement des commandes
for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(folderPath, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const commandNames = commands.map(command => command.name); // Extraire les noms des commandes
colorConsole.log('Commandes prêtes pour enregistrement :', colorConsole.important(commandNames.join(', ')));

// Enregistrement avec Discord
(async () => {
  try {
    await rest.put(Routes.applicationCommands(bot_id), {body: commands});
    colorConsole.success('Commandes enregistrées avec succès !');
    process.exit(0);
  } catch (error) {
    colorConsole.error(`Erreur lors de l'enregistrement des commandes : "${colorConsole.errorImportant(error)}"`);
    process.exit(1);
  }
})();
