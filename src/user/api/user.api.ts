import api from "@/shared/http/client";
import type {
    RegisterEmailPasswordDto,
    UserInfoDto,
    UserSecurityInfoDto,
} from "@/user/types/user";

// 유저 프로필 조회
export const getUserProfile = async (userId: string): Promise<UserInfoDto> => {
    const { data } = await api.get<UserInfoDto>(`/user/profile/${userId}`);
    return data;
};

export const getCurrentUserProfile = async (): Promise<UserInfoDto> => {
    const { data } = await api.get<UserInfoDto>("/user/me");
    return data;
};

export const updateCurrentUserProfile = async (formData: FormData): Promise<UserInfoDto> => {
    const { data } = await api.patch<UserInfoDto>("/user/me", formData);
    return data;
};

export const getUserSecurityInfo = async (): Promise<UserSecurityInfoDto> => {
    const { data } = await api.get<UserSecurityInfoDto>("/user/security");
    return data;
};

export const registerEmailPassword = async (payload: RegisterEmailPasswordDto): Promise<void> => {
    await api.post<void>("/user/credentials", payload);
};

// 유저 삭제
export const deleteUser = async (): Promise<void> => {
    await api.delete<void>("/user/delete");
};
