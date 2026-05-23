export type Platform = {
    id: string;
    name: string;
}

export type Server = {
    id: string;
    name: string;
    type: string;
    platform: string;
    expand?: {
        platform?: Platform;
    };
    version: string;
    modpack: string;
    modpack_url: string;
    world_name: string;
    embed_color: string;
    container: string;
    description: string;
    is_enabled: boolean;
    is_global: boolean;
    image: string;
}
