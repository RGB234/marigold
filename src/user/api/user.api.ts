import api from "../../global/api";
import type {
    RegisterEmailPasswordDto,
    UserInfoDto,
    UserSecurityInfoDto,
} from "@/user/types/user";
import defaultProfileImage from '@/assets/images/default-profile.png';

// 유저 프로필 조회
export const getUserProfile = async (userId: string): Promise<UserInfoDto> => {
    const {data: profile} = await api.get<UserInfoDto>(`/user/profile/${userId}`);

    if (!profile.imageUrl) {
        profile.imageUrl = defaultProfileImage;
    }
    return profile;
};

// 유저 프로필 수정
export const updateUserProfile = async (formData: FormData): Promise<void> => {
    await api.patch<void>("/user", formData, {
        handledErrorStatuses: [400],
    });
};

export const getUserSecurityInfo = async (): Promise<UserSecurityInfoDto> => {
    const { data } = await api.get<UserSecurityInfoDto>("/user/security");
    return data;
};

export const registerEmailPassword = async (payload: RegisterEmailPasswordDto): Promise<void> => {
    await api.post<void>("/user/credentials", payload, { skipAlert: true });
};

// 유저 삭제
export const deleteUser = async (): Promise<void> => {
    await api.delete<void>("/user/delete", { skipAlert: true });
};
