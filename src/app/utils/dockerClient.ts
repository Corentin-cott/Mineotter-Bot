import Docker, { DockerOptions } from "dockerode";

function buildOptions(): DockerOptions {
    const dockerHost = process.env.DOCKER_HOST;

    if (!dockerHost) {
        return process.platform === "win32"
            ? { socketPath: "//./pipe/docker_engine" }
            : { socketPath: "/var/run/docker.sock" };
    }

    const url = new URL(dockerHost);

    if (url.protocol === "tcp:" || url.protocol === "http:") {
        return {
            host: url.hostname,
            port: parseInt(url.port, 10) || 2375,
        };
    }

    if (url.protocol === "unix:" || url.protocol === "npipe:") {
        return { socketPath: url.pathname };
    }

    throw new Error(`Unsupported DOCKER_HOST protocol: ${url.protocol}`);
}

export const docker = new Docker(buildOptions());
