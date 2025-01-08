const {Client, Collection, GatewayIntentBits, Events} = require('discord.js');
const colorConsole = require(__dirname + '/utils/colorConsole.js');
const fs = require('fs');
const path = require('path');

configPath = __dirname + '/config.json';
if (!fs.existsSync(configPath)) {
  colorConsole.error(`Le fichier "${colorConsole.important('config.json')}" n'existe pas. Veuillez le créer en lançant le script ${colorConsole.important('./scripts/deploy-config.js')}.`);
  process.exit(1);
}
const {bot_token} = require(configPath);

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

// Gestions des commandes
client.commands = new Collection(); // Collection pour stocker les commandes

// Chargement des commandes
colorConsole.log('Chargement des commandes...');

const commandsPath = path.join(__dirname, 'commands');
const commandFolder = fs.readdirSync(commandsPath);

for (const folder of commandFolder) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      colorConsole.success(`Commande chargée : ${colorConsole.important(file)}`);
    } else {
      colorConsole.warn(`La commande ${colorConsole.important(file)} n'est pas correctement formatée`);
    }
  }
}

// Chargement des événements
colorConsole.log('Chargement des événements...');

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  colorConsole.success(`Événement chargé : ${colorConsole.important(file)}`);
}

// Connexion du bot
colorConsole.log('Les commandes et événements ont été chargés. Connexion du bot...');

client.once(Events.ClientReady, () => {
  colorConsole.success(`Bot connecté en tant que ${colorConsole.important(client.user.tag)}`);
});

client.login(bot_token);
