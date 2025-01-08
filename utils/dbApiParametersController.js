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
        reject('Error connecting to the database: ' + err.stack);
      } else {
        resolve('Connected to the database.');
      }
    });
  });
}

function closeConnection() {
  connection.end(err => {
    if (err) {
      console.error('Error closing the connection:', err);
    } else {
      console.log('Connection closed.');
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
