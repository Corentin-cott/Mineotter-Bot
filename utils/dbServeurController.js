const dbApiParametersController = require(__dirname + '/dbApiParametersController.js');
const colorConsole = require(__dirname + '/colorConsole.js');
const { db_host, db_user, db_password, global_db_name, api_token } = require('../config.json');
const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_password,
  database: global_db_name
});

function connectToDB() {
  return new Promise((resolve, reject) => {
    connection.connect(err => {
      if (err) {
        colorConsole.error(`Erreur lors de la connexion à la base de données : ${colorConsole.errorImportant(err)}`);
        reject(err);
      } else {
        colorConsole.success('Connexion à la base de données établie.');
        resolve();
      }
    });
  });
}

function closeConnection() {
  connection.end(err => {
    if (err) {
      colorConsole.error(`Erreur lors de la fermeture de la connexion à la base de données : ${colorConsole.errorImportant(err)}`);
    } else {
      colorConsole.success('Connexion à la base de données fermée.');
    }
  });
}

function getServerEmoji(server) {
  if (server.jeu !== 'Minecraft') {
    return '<:other_servers:1325467780602138736>';
  } else if (server.modpack === 'Minecraft Vanilla') {
    return '<:mc_primaire:1325274691581120582>';
  } else {
    return '<:mc_secondaire:1325274670215200789>';
  }
}

function getAllServers() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM serveurs', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function getServerById(id) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM serveurs WHERE id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
}

function getAllActiveServers() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM serveurs WHERE actif = 1', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function getAllMinecraftServers() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM serveurs WHERE jeu = "Minecraft"', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function getAllActiveMinecraftServers() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM serveurs WHERE jeu = "Minecraft" AND actif = 1', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function getServerPrimaire() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT id_serv_primaire FROM serveurs_parameters', (err, results) => {
      if (err) reject(err);
      else resolve(results[0]?.id_serv_primaire);
    });
  });
}

function getServerSecondaire() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT id_serv_secondaire FROM serveurs_parameters', (err, results) => {
      if (err) reject(err);
      else resolve(results[0]?.id_serv_secondaire);
    });
  });
}

async function getServeurStatus(id) {
  const apiRoute = `${await dbApiParametersController.getRouteByAlias('serveursInfos')}${id}`;
  try {
    let apiUrl = new URL(apiRoute);
    let apiResponse = await fetch(apiUrl);
    let apiData = await apiResponse.json();
    return {
      online: apiData.online,
      nb_joueurs: apiData.nb_joueurs
    };
  } catch (error) {
    colorConsole.error(`Une erreur est survenue lors de la récupération du statut du serveur ${colorConsole.important(id)} : ${colorConsole.errorImportant(error)}`);
    return null;
  }
}

function isServerActive(id) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT actif FROM serveurs WHERE id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(!!results[0]?.actif);
    });
  });
}

function isServerGlobal(id) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT global FROM serveurs WHERE id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(!!results[0]?.global);
    });
  });
}

async function startServer(id) {
  const apiRoute = `${await dbApiParametersController.getRouteByAlias('serveursStart')}`;
  try {
    const response = await fetch(apiRoute, {
        method: 'POST',
        body: JSON.stringify({ id_serv: id, client_token: api_token }),
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    return data;
  } catch (error) {
    colorConsole.error(`Une erreur est survenue lors du démarrage du serveur ${colorConsole.important(id)} : ${colorConsole.errorImportant(error)}`);
    return false;
  }
}


function getRconParameters() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM serveurs_parameters LIMIT 1', (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
}

function linkServerToInvestor(serverId, utilisateurId) {
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO serveurs_invests (serveur_id, utilisateur_id) VALUES (?, ?)',
      [serverId, utilisateurId],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
}

function linkServerToAdministrator(serverId, utilisateurId) {
  return new Promise((resolve, reject) => {
    connection.query(
      'INSERT INTO serveurs_admins (serveur_id, utilisateur_id) VALUES (?, ?)',
      [serverId, utilisateurId],
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
}

module.exports = {
  connectToDB,
  closeConnection,
  getServerEmoji,
  getAllServers,
  getServerById,
  getAllActiveServers,
  getAllMinecraftServers,
  getAllActiveMinecraftServers,
  getServerPrimaire,
  getServerSecondaire,
  getServeurStatus,
  isServerActive,
  isServerGlobal,
  startServer,
  getRconParameters,
  linkServerToInvestor,
  linkServerToAdministrator
};
