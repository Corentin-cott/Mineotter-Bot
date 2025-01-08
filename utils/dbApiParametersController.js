const colorConsole = require(__dirname + '/colorConsole.js');
const mysql = require('mysql2');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(__dirname + '/../config.json'));
const connection = mysql.createConnection({
  host: config.db_host,
  user: config.db_user,
  password: config.db_password,
  database: config.api_db_name
});

function connectToDB() {
  return new Promise((resolve, reject) => {
    connection.connect(err => {
      if (err) {
        colorConsole.error(`Error connecting to the database : ${colorConsole.errorImportant(err)}`);
        reject(err);
      } else {
        colorConsole.success('Connected to the database.');
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

async function getAllRoutes() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM routes', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function getRouteById(id) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM routes WHERE id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]);
    });
  });
}

async function getRouteByAlias(alias) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM routes WHERE alias = ?', [alias], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]?.route);
    });
  });
}

async function getAllParameters() {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM parameters', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function getParameterByName(parametre) {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM parameters WHERE parametre = ?', [parametre], (err, results) => {
      if (err) reject(err);
      else resolve(results[0]?.valeur);
    });
  });
}

module.exports = {
  connectToDB,
  closeConnection,
  getAllRoutes,
  getRouteById,
  getRouteByAlias,
  getAllParameters,
  getParameterByName
};
