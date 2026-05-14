export type Serveur = {
    id: number;
    nom: string;
    jeu: string;
    version: string;
    modpack: string;
    modpack_url: string;
    nom_monde: string;
    embed_color: string;
    contenaire: string;
    description: string;
    actif: 0 | 1;
    global: 0 | 1;
    type: string;
    image: string;
}
