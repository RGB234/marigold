import api from "../../global/api";
import type { ApiResponse } from "@/global/types/common";
import type { UserProfileResponse } from "@/user/types/user";
import defaultProfileImage from '@/assets/images/default-profile.png';

// 유저 프로필 조회
export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
    const {data: apiResponse} = await api.get<ApiResponse<UserProfileResponse>>(`/user/profile/${userId}`);
    const profile = apiResponse.data;

    if (!profile) {
        throw new Error("유저 프로필 데이터를 불러오지 못했습니다.");
    }

    if (!profile.imageUrl) {
        profile.imageUrl = defaultProfileImage;
    }
    return profile;
};

// 유저 프로필 수정
export const updateUserProfile = async (formData: FormData): Promise<void> => {
    await api.patch<ApiResponse<void>>("/user/update", formData);
};

// 유저 삭제
export const deleteUser = async (): Promise<void> => {
    await api.delete<ApiResponse<void>>("/user/delete");
};
