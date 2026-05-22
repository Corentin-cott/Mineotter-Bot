import http from 'http';
import { Client } from 'discord.js';
import {otterlogs} from "../otterlogs";

/**
 * OtterHealthCheck utility class to expose a /healthcheck HTTP endpoint.
 */
export class OtterHealthCheck {
    private static server: http.Server | null = null;

    /**
     * Starts a lightweight HTTP server on the specified port.
     * @param client The Discord client instance (optional, for ping reporting).
     */
    public static start(client?: Client): void {
        const port = parseInt(process.env.HEALTHCHECK_PORT || '3000', 10);

        if (this.server) {
            otterlogs.warn("OtterHealthCheck: Server is already running.");
            return;
        }

        this.server = http.createServer((req, res) => {
            if (req.method === 'GET' && req.url === '/healthcheck') {
                const uptimeSeconds = process.uptime();

                const healthData = {
                    status: client?.ws.status === 0 ? 'UP' : 'DOWN',
                    name: process.env.BOT_NAME || 'otterbot',
                    version: process.env.VERSION || '1.0.0',
                    timestamp: new Date().toISOString(),
                    uptime: {
                        seconds: Math.floor(uptimeSeconds),
                        human: this.formatUptime(uptimeSeconds)
                    },
                    discord: {
                        ping: client?.ws.ping || 0
                    },
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(healthData, null, 2));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });

        this.server.listen(port, () => {
            otterlogs.success(`OtterHealthCheck: Listening on port ${port} (/healthcheck)`);
        });

        this.server.on('error', (err) => {
            otterlogs.error(`OtterHealthCheck: Server error: ${err.message}`);
        });
    }

    /**
     * Formats seconds into a human-readable uptime string.
     */
    private static formatUptime(seconds: number): string {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0) parts.push(`${s}s`);

        return parts.join(' ') || '0s';
    }
}
