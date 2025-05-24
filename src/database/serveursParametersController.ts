import * as mysql from "mysql2/promise";
import otterlogs from "../utils/otterlogs";

export class ServeurParametersController {
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

    private async getParameter<T>(column: string): Promise<T | null> {
        try {
            const sql = `SELECT ${column} FROM serveurs_parameters LIMIT 1`;
            const [results] = await this.pool.execute<mysql.RowDataPacket[]>(sql);
            return results.length > 0 ? results[0][column] : null;
        } catch (error) {
            otterlogs.error(`Erreur lors de la récupération de ${column} : ${error}`);
            return null;
        }
    }

    async getPrimaryServeurId(): Promise<number | null> {
        return this.getParameter<number>("id_serv_primaire");
    }

    async getPrimaryServeurHost(): Promise<string | null> {
        return this.getParameter<string>("host_primaire");
    }

    async getSecondaryServeurId(): Promise<number | null> {
        return this.getParameter<number>("id_serv_secondaire");
    }

    async getSecondaryServeurHost(): Promise<string | null> {
        return this.getParameter<string>("host_secondaire");
    }

    async getRconPassword(): Promise<string | null> {
        return this.getParameter<string>("rcon_password");
    }

    async getPartenaireServeurId(): Promise<number | null> {
        return this.getParameter<number>("id_serv_partenaire");
    }

    async getPartenaireServeurHost(): Promise<string | null> {
        return this.getParameter<string>("host_partenaire");
    }

    async getPartenaireRconPassword(): Promise<string | null> {
        return this.getParameter<string>("rcon_password_partenaire");
    }
}
