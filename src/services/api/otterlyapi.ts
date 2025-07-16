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

export const fetchServerById = async (id: number): Promise<ServeurType> => {
    const response = await axios.get<{ success: boolean; data: ServeurType }>(
        `${BASE_URL}/serveurs/infos/${id}`
    );

    if (!response.data.success) {
        throw new Error(`Erreur lors de la récupération du serveur avec l'ID ${id}`);
    }

    return response.data.data;
};