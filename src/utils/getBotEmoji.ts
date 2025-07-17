import otterlogs from "./otterlogs";

const emojis = {
    mc_mod: "<:mcmod:1395335025557504113>",
    mc_van: "<:mcvan:1395335018196238397>",
    mineotter: "<a:mineotter:1355287083559944282>"
} as const;

const dev_emojis = {
    mc_mod: "<:mcmod:1395335754254913638>",
    mc_van: "<:mcvan:1395335747283718245>",
    mineotter: "<a:mineotter:1395336681284173854>"
} as const;

type EmojiName = keyof typeof emojis;

/**
 * Récupère un emoji par son nom selon l'environnement.
 * @param name Le nom de l'emoji (ex : 'mc_mod')
 * @param dev Si `true`, retourne la version de Mineotter-Dev
 * @returns L'emoji en string format markdown ou une chaîne vide si non trouvé
 */
function getEmojiByName(name: string, dev = false): string {
    const emojiSet = dev ? dev_emojis : emojis;
    return (emojiSet as Record<string, string>)[name] ?? "";
}

export default getEmojiByName;