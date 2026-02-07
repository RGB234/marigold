import api from "./api";

const apiStorageGet = import.meta.env.VITE_API_STORAGE_GET;

export const getPresignedUrl = async (storeFileName: string) : Promise<string> => {
    const response = await api.get(`${apiStorageGet}/`,
        {
            params: {
                storeFileName: storeFileName
            }
        }
    );
    return response.data;
}
