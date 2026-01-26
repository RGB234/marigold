import api from "@/api/api";
import { AdoptionDetailResponse, AdoptionListResponse } from "@/types/apiResponse";

type UUID = string;

const apiAdoption = import.meta.env.VITE_API_ADOPTION;

// 생성
export const createAdoption = async (formData: FormData) : Promise<number> => {
  const response = await api.post(`${apiAdoption}/create`, formData);
  return response.data.id;
};

// 수정
export const editAdoption = async (id: number, formData: FormData) => {
  const response = await api.patch(`${apiAdoption}/${id}`, formData);
  return response.data;
};

// 삭제
export const deleteAdoption = async (id: UUID) => {
  const response = await api.delete(`${apiAdoption}/${id}`);
  return response.data;
};

// 상세보기
export const getAdoptionDetail = async (id: UUID): Promise<AdoptionDetailResponse> => {
  const response = await api.get<AdoptionDetailResponse>(`${apiAdoption}/${id}`); // Path Variable
  return response.data;
};

// 목록 보기
export const getAdoptionList = async (params: { [key: string]: any }): Promise<AdoptionListResponse> => {
  const response = await api.get<AdoptionListResponse>(`${apiAdoption}`, {
    params: params, // 검색조건
  });
  return response.data;
};

// 작성글 목록 보기
export const getUserAdoptions = async (userId: UUID) : Promise<AdoptionListResponse> => {
  const response = await api.get<AdoptionListResponse>(`${apiAdoption}/writer/${userId}`);
  return response.data;
};