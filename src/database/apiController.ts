import * as mysql from "mysql2/promise";
import otterlogs from "../utils/otterlogs";

export type TokenType = {
    id: number;
    utilisateur: string;
    role: string;
    token: string;
    createdAt: Date;
};

export class ApiController {
    private readonly pool: mysql.Pool;

    constructor() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
    }

    async getRouteByAlias(alias: string) {
        try {
            const sql = "SELECT * FROM api_routes WHERE alias = ? LIMIT 1";
            const [results] = await this.pool.execute<mysql.RowDataPacket[]>(sql, [alias]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            otterlogs.error(`Erreur lors de la récupération de la route API : ${error}`);
            return null;
        }
    }

    async getToken() : Promise<TokenType | null> {
        try {
            const sql = "SELECT * FROM api_token WHERE utilisateur = 'multiloutre' LIMIT 1;";
            const [results] = await this.pool.execute<mysql.RowDataPacket[]>(sql);
            return results.length > 0 ? results[0] as TokenType : null;
        } catch (error) {
            otterlogs.error(`Erreur lors de la récupération du token API : ${error}`);
            return null;
        }
    }
}
