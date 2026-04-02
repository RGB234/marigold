import api from "@/global/api";
import { ApiResponse, PageableParams } from "@/global/types/common";
import {
  AdoptionPostPageResponse, AdoptionPostDetailResponse,
  AdoptionPostSearchParams,
  AdoptionCandidateResponse,
  CompleteAdoptionRequest,
  AdoptionPostResponse,
} from "@/adoption/types/adoptionPost";
import defaultProfileImage from '@/assets/images/default-profile.png';
type TSID = string;

// 생성
export const createAdoptionPost = async (formData: FormData): Promise<ApiResponse<{ id: number }>> => {
  const {data: apiResponse} = await api.post<ApiResponse<{ id: number }>>("/adoption", formData);
  return apiResponse;
};

// 수정
export const updateAdoptionPost = async (id: number | string, formData: FormData): Promise<void> => {
  await api.patch<ApiResponse<void>>(`/adoption/${id}`, formData);
};

// 삭제
export const deleteAdoptionPost = async (id: number | string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/adoption/${id}`);
};

// 입양 상태 변경
export const updateAdoptionPostStatus = async (id: BigInt | string, status: string): Promise<void> => {
    const params = { status };
    await api.patch<ApiResponse<void>>(`/adoption/${id}/status`, null, { params });
};


export const getAdoptionPostSummary = async (id: number | string): Promise<AdoptionPostResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostResponse>>(`/adoption/${id}/summary`);

  if (!apiResponse.data) {
    throw new Error("입양 게시글 데이터를 불러오지 못했습니다.");
  }

  return apiResponse.data;
};


// 상세보기
export const getAdoptionPostDetail = async (id: number | string): Promise<AdoptionPostDetailResponse> => {
  const {data : apiResponse} = await api.get<ApiResponse<AdoptionPostDetailResponse>>(`/adoption/${id}`);
  const detail = apiResponse.data;

  if (!detail) {
    throw new Error("입양 상세 데이터를 불러오지 못했습니다.");
  }

  // 작성자 프로필 이미지
  if (!detail.writer?.imageUrl) {
    detail.writer.imageUrl = defaultProfileImage;
  }
  
  if (detail.adopter && !detail.adopter.imageUrl) {
    detail.adopter.imageUrl = defaultProfileImage;
  }

  return detail;
};

// 목록 보기
export const getAdoptionPostList = async (params: AdoptionPostSearchParams): Promise<AdoptionPostPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostPageResponse>>("/adoption", { params });
  const page = apiResponse.data;

  if (!page) {
    throw new Error("입양 목록 데이터를 불러오지 못했습니다.");
  }

  return page;
};

// 작성글 목록 보기
export const getAdoptionPostListByWriter = async (userId: TSID, params?: PageableParams): Promise<AdoptionPostPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostPageResponse>>(`/adoption/writer/${userId}`, { params });
  const page = apiResponse.data;

  if (!page) {
    throw new Error("작성글 목록 데이터를 불러오지 못했습니다.");
  }

  return page;
};

export const getAdoptionPostListByAdopter = async (userId: TSID, params?: PageableParams): Promise<AdoptionPostPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostPageResponse>>(`/adoption/adopter/${userId}`, { params });
  const page = apiResponse.data;

  if (!page) {
    throw new Error("입양 목록 데이터를 불러오지 못했습니다.");
  }

  return page;
};


// 입양 후보자(채팅 상대) 목록 조회
export const getAdoptionCandidates = async (id: number | string): Promise<AdoptionCandidateResponse[]> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionCandidateResponse[]>>(`/adoption/${id}/candidates`);
  const candidates = apiResponse.data ?? [];
  if (candidates.length) {
    candidates.forEach((candidate) => {
      if (!candidate.imageUrl) {
        candidate.imageUrl = defaultProfileImage;
      }
    });
  }
  return candidates;
};

// 입양 완료 처리
export const completeAdoption = async (id: number | string, data: CompleteAdoptionRequest): Promise<void> => {
  await api.post<ApiResponse<void>>(`/adoption/${id}/complete`, data);
};

// 입양 완료 취소
export const cancelCompleteAdoption = async (id: number | string): Promise<void> => {
  await api.post<ApiResponse<void>>(`/adoption/${id}/cancel-complete`);
};
