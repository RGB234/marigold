import api from "./api";
import type { UUID } from "@/types/common";
const apiUserProfile = import.meta.env.VITE_API_USER_PROFILE;
const apiUserUpdate = import.meta.env.VITE_API_USER_UPDATE;
const apiUserDelete = import.meta.env.VITE_API_USER_DELETE;

import defaultProfileImage from '@/assets/images/default-profile.png';
import { UserProfileResponse } from "@/types/apiResponse";

export const getUserProfile = async (UUID: UUID): Promise<UserProfileResponse> => {
    const response = await api.get<UserProfileResponse>(`${apiUserProfile}/${UUID}`);
    if (response.data.imageUrl === null) {
        response.data.imageUrl = defaultProfileImage;
    }
    return response.data;
}

// export const updateUserProfile = async (UUID: UUID, formData: FormData) => {
export const updateUserProfile = async (formData: FormData) => {
    const response = await api.patch(`${apiUserUpdate}`, formData);
    return response.data;
}

export const deleteUser = async(UUID : UUID) => {
    const response = await api.delete(apiUserDelete);
    return response.data;
}