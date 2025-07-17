import axios from 'axios';
import { ServeurType, OtterlyApiResponse } from '../../types/otterly';

const BASE_URL = 'https://otterlyapi.antredesloutres.fr/api';

export const fetchAllServeurs = async (): Promise<ServeurType[]> => {
    const response = await axios.get<OtterlyApiResponse>(`${BASE_URL}/serveurs/primaire-secondaire`);
    if (!response.data.success) throw new Error("Erreur lors de la récupération des serveurs");
    return response.data.data;
};

export const fetchPrimaryServer = async (): Promise<ServeurType | null> => {
    const serveurs = await fetchAllServeurs();
    return serveurs.find(s => s.type === 'primary') || null;
};

export const fetchSecondaryServer = async (): Promise<ServeurType | null> => {
    const serveurs = await fetchAllServeurs();
    return serveurs.find(s => s.type === 'secondary') || null;
};

export const fetchPrimaryAndSecondaryServers = async (): Promise<{ primary: ServeurType; secondary: ServeurType }> => {
    const serveurs = await fetchAllServeurs();
    const primary = serveurs.find(s => s.type === 'primary');
    const secondary = serveurs.find(s => s.type === 'secondary');

    if (!primary || !secondary) {
        throw new Error('Primary and/or secondary server not found');
    }

    return { primary, secondary };
};

export const fetchPrimaryAndSecondaryIds = async (): Promise<{ primaryId: number; secondaryId: number }> => {
    const serveurs = await fetchAllServeurs();
    const primary = serveurs.find(s => s.type === 'primary');
    const secondary = serveurs.find(s => s.type === 'secondary');

    if (!primary || !secondary) {
        throw new Error('Primary and/or secondary server not found');
    }

    return {
        primaryId: primary.id,
        secondaryId: secondary.id,
    };
};

export const fetchServerById = async (id: number): Promise<ServeurType> => {
    const response = await axios.get<{ success: boolean; data: ServeurType }>(
        `${BASE_URL}/serveurs/infos/${id}`
    );

    if (!response.data.success) {
        throw new Error(`Erreur lors de la récupération du serveur avec l'ID ${id}`);
    }

    return response.data.data;
};

export const updateSecondaryServerId = async (id: number): Promise<boolean> => {
    const response = await axios.post<{ success: boolean }>(
        `${BASE_URL}/serveurs/start/`,
        { id },
        {
            headers: {
                Authorization: process.env.API_TOKEN || '',
            }
        }
    );

    if (!response.data.success) {
        throw new Error(`Erreur lors du lancement du serveur avec l'ID ${id}`);
    }

    return response.data.success;
};