import * as mysql from "mysql2/promise";
import otterlogs from "../utils/otterlogs";

type Serveur = {
    name: any;
    id: number;
    nom: string;
    jeu: string;
    version: string;
    modpack: string;
    modpack_url: string | null;
    nom_monde: string;
    embed_color: string;
    path_serv: string;
    start_script: string;
    actif: boolean;
    global: boolean;
};

export class ServeursDatabase {
    private readonly pool: mysql.Pool;

    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            port: process.env.DB_PORT ?? 3306,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }

    async close(): Promise<void> {
        try {
            await this.pool.end();
            otterlogs.log("Pool de connexions fermé.");
        } catch (error) {
            otterlogs.error(`Erreur lors de la fermeture du pool de connexions : ${error}`);
        }
    }

    async query<T = any>(query: string, values: any[] = []): Promise<{ results: T[]; fields: mysql.FieldPacket[] }> {
        try {
            const [results, fields] = await this.pool.execute<mysql.RowDataPacket[]>(query, values);
            return { results: results as T[], fields };
        } catch (error) {
            otterlogs.error(`Erreur lors de la requête : ${error}`);
            return { results: [], fields: [] };
        }
    }

    async getServeurById(id: number): Promise<{ results: Serveur[]; fields: mysql.FieldPacket[] }> {
        return this.query<Serveur>("SELECT * FROM serveurs WHERE id = ?", [id]);
    }

    async getAllServeurs(): Promise<{ results: Serveur[]; fields: mysql.FieldPacket[] }> {
        return this.query<Serveur>("SELECT * FROM serveurs WHERE jeu = 'Minecraft'");
    }

    async getAllGlobalServeurs(): Promise<{ results: Serveur[]; fields: mysql.FieldPacket[] }> {
        return this.query<Serveur>("SELECT * FROM serveurs WHERE jeu = 'Minecraft' AND global = 1");
    }

    async getAllActifServeurs(): Promise<{ results: Serveur[]; fields: mysql.FieldPacket[] }> {
        return this.query<Serveur>("SELECT * FROM serveurs WHERE jeu = 'Minecraft' AND actif = 1");
    }

    async getAllGlobalActifServeurs(): Promise<{ results: Serveur[]; fields: mysql.FieldPacket[] }> {
        return this.query<Serveur>("SELECT * FROM serveurs WHERE jeu = 'Minecraft' AND actif = 1 AND global = 1");
    }

    async insertServeur(values: Omit<Serveur, "id">): Promise<{ results: mysql.OkPacket; fields: mysql.FieldPacket[] }> {
        try {
            const columns = Object.keys(values).join(', ');
            const placeholders = Object.keys(values).map(() => '?').join(', ');
            const insertValues = Object.values(values);
            const sql = `INSERT INTO serveurs (${columns}) VALUES (${placeholders})`;
            const [results, fields] = await this.pool.execute<mysql.OkPacket>(sql, insertValues);
            return { results, fields };
        } catch (error) {
            otterlogs.error(`Erreur lors de l'insertion du serveur : ${error}`);
            return { results: {} as mysql.OkPacket, fields: [] };
        }
    }

    async updateServeur(id: number, values: Partial<Serveur>): Promise<{ results: mysql.OkPacket; fields: mysql.FieldPacket[] }> {
        try {
            const setClause = Object.keys(values).map(key => `${key} = ?`).join(', ');
            const updateValues = Object.values(values);
            const sql = `UPDATE serveurs SET ${setClause} WHERE id = ?`;
            const [results, fields] = await this.pool.execute<mysql.OkPacket>(sql, [...updateValues, id]);
            return { results, fields };
        } catch (error) {
            otterlogs.error(`Erreur lors de la mise à jour du serveur : ${error}`);
            return { results: {} as mysql.OkPacket, fields: [] };
        }
    }

    async deleteServeur(id: number): Promise<{ results: mysql.OkPacket; fields: mysql.FieldPacket[] }> {
        try {
            const sql = `DELETE FROM serveurs WHERE id = ?`;
            const [results, fields] = await this.pool.execute<mysql.OkPacket>(sql, [id]);
            return { results, fields };
        } catch (error) {
            otterlogs.error(`Erreur lors de la suppression du serveur : ${error}`);
            return { results: {} as mysql.OkPacket, fields: [] };
        }
    }
}
