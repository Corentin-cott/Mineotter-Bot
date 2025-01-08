const colorConsole = require(__dirname + '/../utils/colorConsole.js');
const fs = require('fs');

// Contenu de la configuration de base
const defaultConfig = {
    bot_token: "placeholder",
    bot_id: "placeholder",
    bot_color: "#9adeba",
    db_host: "localhost",
    db_user: "mineotter",
    db_password: "placeholder",
    db_name: "serveurs_informations",
    db_name: "api_serv_parameters"
};

const configPath = __dirname + '/../config.json';

// Vérification si le fichier config.json existe déjà, ça serait dommage de remplacer le fichier déjà completé
if (fs.existsSync(configPath)) {
    colorConsole.warn(`Le fichier "${colorConsole.important('config.json')}" existe déjà. Voulez-vous le remplacer ? (y/n)`);
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (data) => {
        data = data.trim();
        if (data === 'y') {
            createConfig(defaultConfig);
        } else if (data === 'n') {
            colorConsole.info('Opération annulée.');
            process.exit(0);
        } else {
            colorConsole.warn('Veuillez répondre par "y" ou "n".');
        }
    });
} else {
    createConfig(defaultConfig);
}

function createConfig(defaultConfig) {
  try {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4));
      colorConsole.success(`Fichier "${colorConsole.important('config.json')}" créé avec succès !`);
      process.exit(0);
  } catch (error) {
    colorConsole.error(`Erreur lors de la création du fichier "${colorConsole.important('config.json')}" : ${colorConsole.errorImportant(error)}`);
      process.exit(1);
  }
}
