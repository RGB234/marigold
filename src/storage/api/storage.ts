import api from "../../global/api";

const apiStorageGet = import.meta.env.VITE_API_STORAGE_GET;

export const getPresignedUrl = async (fileName: string) : Promise<string> => {
    const response = await api.get(`${apiStorageGet}/`,
        {
            params: {
                name: fileName
            }
        }
    );
    return response.data;
}
