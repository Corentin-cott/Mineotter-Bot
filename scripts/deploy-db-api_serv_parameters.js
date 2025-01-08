const colorConsole = require(__dirname + '/../utils/colorConsole.js');
const { db_host, db_user, db_password, api_db_name } = require('../config.json');
const mysql = require('mysql2');

// Création de la connexion à MySQL
const connection = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_password,
});

// Fonction générique pour créer une table
function createTable(query, table_name) {
  colorConsole.log(`Création de la table ${colorConsole.important(table_name)}...`);
  return new Promise((resolve, reject) => {
    connection.query(query, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Connexion à MySQL et création de la base de données
connection.connect((err) => {
  if (err) {
    colorConsole.error(`Erreur de connexion à la base de données : "${colorConsole.errorImportant(err)}"`);
    return;
  }
  colorConsole.success('Connexion à la base de données établie.');

  // Vérification si la base de données existe
  connection.query(`CREATE DATABASE IF NOT EXISTS ${api_db_name};`, (err, result) => {
    if (err) {
      colorConsole.error(`Erreur lors de la création de la base de données : "${colorConsole.errorImportant(err)}"`);
      connection.end();
      return;
    }
    colorConsole.success(`Base de données ${colorConsole.important(api_db_name)} créée ou existante.`);

    // Sélectionner la base de données et créer les tables
    connection.changeUser({ database: api_db_name }, async (err) => {
      if (err) {
        colorConsole.error(`Erreur lors du changement de base de données : "${colorConsole.errorImportant(err)}"`);
        connection.end();
        return;
      }

      try {
        // Créer toutes les tables en parallèle
        await Promise.all([

          // Nouvelle table : routes
          createTable(`
            CREATE TABLE IF NOT EXISTS routes (
              id INT AUTO_INCREMENT PRIMARY KEY,
              alias VARCHAR(255) UNIQUE NOT NULL,
              route TEXT NOT NULL,
              methode ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH') NOT NULL,
              parametres TEXT,
              description TEXT,
              commentaire TEXT
            );
          `, 'routes'),

          // Nouvelle table : parameters
          createTable(`
            CREATE TABLE IF NOT EXISTS parameters (
              parametre VARCHAR(255) UNIQUE NOT NULL,
              valeur TEXT
            );
          `, 'parameters'),
        ]);

        colorConsole.success('Toutes les tables ont été créées ou existent déjà.');
      } catch (error) {
        colorConsole.error(`Erreur lors de la création des tables : "${colorConsole.errorImportant(error)}"`);
      } finally {
        connection.end();
      }
    });
  });
});
