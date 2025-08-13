export interface ServeurType {
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
    actif: number;
    global: number;
    type: 'primary' | 'secondary';
    image: string;
    players_online: number;
}

export interface OtterlyApiResponse {
    success: boolean;
    data: ServeurType[];
}
