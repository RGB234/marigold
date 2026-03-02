import api from "@/api/api";
import type { ApiResponse, AdoptionDetailResponse, AdoptionListResponse } from "@/types/apiResponse";
import { getPresignedUrl } from "./storage";
import type { GetAdoptionListParams } from "@/types/apiRequest";

type TSID = string;

const apiAdoption = import.meta.env.VITE_API_ADOPTION;

// 생성
export const createAdoption = async (formData: FormData): Promise<ApiResponse<{ id: number }>> => {
  const response: ApiResponse<{ id: number }> = await api.post(`${apiAdoption}`, formData);
  return response;
};

// 수정
export const editAdoption = async (id: number | string, formData: FormData): Promise<void> => {
  await api.patch(`${apiAdoption}/${id}`, formData);
};

// 삭제
export const deleteAdoption = async (id: number | string): Promise<void> => {
  await api.delete(`${apiAdoption}/${id}`);
};

// 상세보기
export const getAdoptionDetail = async (id: number | string): Promise<AdoptionDetailResponse> => {
  const response: ApiResponse<AdoptionDetailResponse> = await api.get(`${apiAdoption}/${id}`);
  const detail = response.data!;

  // 작성자 프로필 이미지 Presigned URL 변환
  if (detail.writer?.imageUrl) {
    detail.writer.imageUrl = await getPresignedUrl(detail.writer.imageUrl);
  }

  return detail;
};

// 목록 보기
export const getAdoptionList = async (params: GetAdoptionListParams): Promise<AdoptionListResponse> => {
  const response: ApiResponse<AdoptionListResponse> = await api.get(`${apiAdoption}`, { params });
  const page = response.data!;

  if (page.content?.length) {
    // 병렬 처리로 이미지 Presigned URL 변환
    await Promise.all(
      page.content.map(async (item) => {
        if (item.imageUrl) {
          item.imageUrl = await getPresignedUrl(item.imageUrl);
        }
      })
    );
  }
  return page;
};

// 작성글 목록 보기
export const getUserAdoptions = async (userId: TSID): Promise<AdoptionListResponse> => {
  const response: ApiResponse<AdoptionListResponse> = await api.get(`${apiAdoption}/writer/${userId}`);
  const page = response.data;

  if (!page) {
    throw new Error('User adoptions not found');
  }

  if (page.content?.length) {
    await Promise.all(
      page.content.map(async (item) => {
        if (item.imageUrl) {
          item.imageUrl = await getPresignedUrl(item.imageUrl);
        }
      })
    );
  }
  return page;
};
