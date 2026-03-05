import api from "../../global/api";
import type { ApiResponse, UserProfileResponse } from "@/global/types/apiResponse";
import { getPresignedUrl } from "../../storage/storage";
import defaultProfileImage from '@/assets/images/default-profile.png';

const apiUserProfile = import.meta.env.VITE_API_USER_PROFILE;
const apiUserUpdate = import.meta.env.VITE_API_USER_UPDATE;
const apiUserDelete = import.meta.env.VITE_API_USER_DELETE;

// 유저 프로필 조회
export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
    const response: ApiResponse<UserProfileResponse> = await api.get(`${apiUserProfile}/${userId}`);
    const profile = response.data;

    if (!profile) {
        throw new Error('User profile not found');
    }

    if (profile.imageUrl) {
        profile.imageUrl = await getPresignedUrl(profile.imageUrl);
    } else {
        profile.imageUrl = defaultProfileImage;
    }
    return profile;
};

// 유저 프로필 수정
export const updateUserProfile = async (formData: FormData): Promise<void> => {
    await api.patch(`${apiUserUpdate}`, formData);
};

// 유저 삭제
export const deleteUser = async (): Promise<void> => {
    await api.delete(apiUserDelete);
};
