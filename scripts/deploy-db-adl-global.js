const colorConsole = require(__dirname + '/../utils/colorConsole.js');
const { db_host, db_user, db_password, global_db_name } = require('../config.json');
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
  connection.query(`CREATE DATABASE IF NOT EXISTS ${global_db_name};`, (err, result) => {
    if (err) {
      colorConsole.error(`Erreur lors de la création de la base de données : "${colorConsole.errorImportant(err)}"`);
      connection.end();
      return;
    }
    colorConsole.success(`Base de données ${colorConsole.important(global_db_name)} créée ou existante.`);

    // Sélectionner la base de données et créer les tables
    connection.changeUser({ database: global_db_name }, async (err) => {
      if (err) {
        colorConsole.error(`Erreur lors du changement de base de données : "${colorConsole.errorImportant(err)}"`);
        connection.end();
        return;
      }

      try {
        // Créer toutes les tables en parallèle
        await Promise.all([
          createTable(`
            CREATE TABLE IF NOT EXISTS serveurs (
              id INT AUTO_INCREMENT PRIMARY KEY,
              nom VARCHAR(255) NOT NULL,
              jeu VARCHAR(255) NOT NULL,
              version VARCHAR(20) NOT NULL,
              modpack VARCHAR(255) NOT NULL,
              modpack_url VARCHAR(255),
              nom_monde VARCHAR(255) NOT NULL,
              embed_color VARCHAR(7) DEFAULT '#000000',
              path_serv TEXT NOT NULL,
              start_script VARCHAR(255) NOT NULL,
              actif BOOLEAN DEFAULT false NOT NULL,
              global BOOLEAN DEFAULT true NOT NULL
            );
          `, 'serveurs'),

          createTable(`
            CREATE TABLE IF NOT EXISTS serveurs_invests (
              id INT AUTO_INCREMENT PRIMARY KEY,
              serveur_id INT NOT NULL,
              utilisateur_id INT NOT NULL,
              FOREIGN KEY (serveur_id) REFERENCES serveurs(id),
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs_discord(id)
            );
          `, 'serveurs_invests'),

          createTable(`
            CREATE TABLE IF NOT EXISTS serveurs_admins (
              id INT AUTO_INCREMENT PRIMARY KEY,
              serveur_id INT NOT NULL,
              utilisateur_id INT NOT NULL,
              FOREIGN KEY (serveur_id) REFERENCES serveurs(id),
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs_discord(id)
            );
          `, 'serveurs_admins'),

          createTable(`
            CREATE TABLE IF NOT EXISTS serveurs_parameters (
              id_serv_primaire INT NOT NULL,
              id_serv_secondaire INT NOT NULL,
              host_primaire VARCHAR(255) NOT NULL,
              host_secondaire VARCHAR(255) NOT NULL,
              rcon_password VARCHAR(255) NOT NULL,
              FOREIGN KEY (id_serv_primaire) REFERENCES serveurs(id),
              FOREIGN KEY (id_serv_secondaire) REFERENCES serveurs(id)
            );
          `, 'serveurs_parameters'),

          createTable(`
            CREATE TABLE IF NOT EXISTS utilisateurs_discord (
              id INT AUTO_INCREMENT PRIMARY KEY,
              discord_id VARCHAR(20) NOT NULL,
              pseudo_discord VARCHAR(255) NOT NULL,
              join_date_discord DATETIME NOT NULL,
              prem_connexion DATETIME,
              dern_connexion DATETIME
            );
          `, 'utilisateurs_discord'),

          createTable(`
            CREATE TABLE IF NOT EXISTS utilisateurs_activites (
              id INT AUTO_INCREMENT PRIMARY KEY,
              utilisateur_id INT NOT NULL,
              points_total INT DEFAULT 0,
              points_annee INT DEFAULT 0,
              points_mois INT DEFAULT 0,
              points_jour INT DEFAULT 0,
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs_discord(id)
            );
          `, 'utilisateurs_activites'),

          createTable(`
            CREATE TABLE IF NOT EXISTS joueurs_mc (
              uuid VARCHAR(255) PRIMARY KEY,
              utilisateur_id INT NOT NULL,
              premiere_co DATETIME,
              derniere_co DATETIME,
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs_discord(id)
            );
          `, 'joueurs_mc'),

          createTable(`
            CREATE TABLE IF NOT EXISTS serveurs_connections_log (
              id INT AUTO_INCREMENT PRIMARY KEY,
              joueurs_mc_uuid VARCHAR(255) NOT NULL,
              serveur_id INT NOT NULL,
              date DATETIME,
              FOREIGN KEY (joueurs_mc_uuid) REFERENCES joueurs_mc(uuid),
              FOREIGN KEY (serveur_id) REFERENCES serveurs(id)
            );
          `, 'serveurs_connections_log'),

          createTable(`
            CREATE TABLE IF NOT EXISTS stats_mc (
              id INT AUTO_INCREMENT PRIMARY KEY,
              serveur_id INT NOT NULL,
              joueurs_mc_uuid VARCHAR(255) NOT NULL,
              tmps_jeux BIGINT DEFAULT 0,
              nb_mort INT DEFAULT 0,
              nb_kills INT DEFAULT 0,
              nb_playerkill INT DEFAULT 0,
              mob_killed JSON,
              nb_blocs_detr INT DEFAULT 0,
              nb_blocs_pose INT DEFAULT 0,
              dist_total INT DEFAULT 0,
              dist_pieds INT DEFAULT 0,
              dist_elytres INT DEFAULT 0,
              dist_vol INT DEFAULT 0,
              item_crafted JSON,
              item_broken JSON,
              achievement JSON,
              dern_enregistrment DATETIME NOT NULL,
              FOREIGN KEY (serveur_id) REFERENCES serveurs(id),
              FOREIGN KEY (joueurs_mc_uuid) REFERENCES joueurs_mc(uuid)
            );
          `, 'stats_mc'),

          createTable(`
            CREATE TABLE IF NOT EXISTS badges (
              id INT AUTO_INCREMENT PRIMARY KEY,
              nom VARCHAR(100) NOT NULL,
              categorie VARCHAR(100) NOT NULL,
              actif BOOLEAN DEFAULT true
            );
          `, 'badges'),

          createTable(`
            CREATE TABLE IF NOT EXISTS badges_utilisateurs (
              id INT AUTO_INCREMENT PRIMARY KEY,
              utilisateur_id INT NOT NULL,
              badge_id INT NOT NULL,
              date_recu DATETIME NOT NULL,
              FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs_discord(id),
              FOREIGN KEY (badge_id) REFERENCES badges(id)
            );
          `, 'badges_utilisateurs'),
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
