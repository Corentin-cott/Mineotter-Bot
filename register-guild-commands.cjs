require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

function getAllCommandFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
        entry.isDirectory()
            ? getAllCommandFiles(path.join(dir, entry.name))
            : entry.name.endsWith('.js') ? [path.join(dir, entry.name)] : []
    );
}

function resolveCommand(mod) {
    let cmd = mod;
    while (cmd && typeof cmd === 'object' && 'default' in cmd) cmd = cmd.default;
    return cmd;
}

(async () => {
    const { BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;
    if (!BOT_TOKEN || !DISCORD_CLIENT_ID || !DISCORD_GUILD_ID) {
        console.error('Missing BOT_TOKEN, DISCORD_CLIENT_ID or DISCORD_GUILD_ID in .env');
        process.exit(1);
    }

    const dirs = [
        path.join(__dirname, 'build', 'otterbots', 'commands'),
        path.join(__dirname, 'build', 'app', 'commands'),
    ];

    const files = dirs.flatMap(getAllCommandFiles).filter(f => !f.endsWith('.d.ts'));
    const commandsData = [];

    for (const file of files) {
        const cmd = resolveCommand(require(file));
        if (cmd && cmd.data && typeof cmd.execute === 'function') {
            commandsData.push(cmd.data.toJSON());
        }
    }

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    const result = await rest.put(
        Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
        { body: commandsData }
    );

    console.log(`Registered ${result.length} guild command(s) instantly:`);
    result.forEach(c => console.log(' -', c.name));
    process.exit(0);
})().catch(err => {
    console.error('Failed to register guild commands:', err);
    process.exit(1);
});
