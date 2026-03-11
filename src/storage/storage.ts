import { ApiResponse } from "@/global/types/apiResponse";
import api from "../global/api";

export const getPresignedUrl = async (fileName: string) : Promise<string> => {
    const {data: apiResponse} = await api.get<ApiResponse<string>>("/storage/",
        {
            params: {
                name: fileName
            }
        }
    );
    return apiResponse.data!;
}
