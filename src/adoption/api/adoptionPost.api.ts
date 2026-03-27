import api from "@/global/api";
import { ApiResponse, PageableParams } from "@/global/types/common";
import {
  AdoptionPostPageResponse, AdoptionPostDetailResponse,
  AdoptionPostWithChatPageResponse,
  AdoptionPostSearchParams,
  AdoptionCandidateResponse,
  CompleteAdoptionRequest,
} from "@/adoption/types/adoptionPost";
import { getPresignedUrl } from "@/storage/storage";
type TSID = string;

// 생성
export const createAdoption = async (formData: FormData): Promise<ApiResponse<{ id: number }>> => {
  const {data: apiResponse} = await api.post<ApiResponse<{ id: number }>>("/adoption", formData);
  return apiResponse;
};

// 수정
export const editAdoption = async (id: number | string, formData: FormData): Promise<void> => {
  await api.patch<ApiResponse<void>>(`/adoption/${id}`, formData);
};

// 삭제
export const deleteAdoption = async (id: number | string): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/adoption/${id}`);
};

// 입양 상태 변경
export const updateAdoptionStatus = async (id: BigInt | string, status: string): Promise<void> => {
    const params = { status };
    await api.patch<ApiResponse<void>>(`/adoption/${id}/status`, null, { params });
};

// 상세보기
export const getAdoptionDetail = async (id: number | string): Promise<AdoptionPostDetailResponse> => {
  const {data : apiResponse} = await api.get<ApiResponse<AdoptionPostDetailResponse>>(`/adoption/${id}`);
  const detail = apiResponse.data;

  if (!detail) {
    throw new Error("입양 상세 데이터를 불러오지 못했습니다.");
  }

  // 작성자 프로필 이미지 Presigned URL 변환
  if (detail.writer?.imageUrl) {
    detail.writer.imageUrl = await getPresignedUrl(detail.writer.imageUrl);
  }

  return detail;
};

// 목록 보기
export const getAdoptionList = async (params: AdoptionPostSearchParams): Promise<AdoptionPostPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostPageResponse>>("/adoption", { params });
  const page = apiResponse.data;

  if (!page) {
    throw new Error("입양 목록 데이터를 불러오지 못했습니다.");
  }

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
export const getUserAdoptions = async (userId: TSID, params?: PageableParams): Promise<AdoptionPostPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostPageResponse>>(`/adoption/writer/${userId}`, { params });
  const page = apiResponse.data;

  if (!page) {
    throw new Error("작성글 목록 데이터를 불러오지 못했습니다.");
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

export const getUserAdoptionPostListByJoinedChat = async (params?: PageableParams): Promise<AdoptionPostWithChatPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostWithChatPageResponse>>(`/adoption/chat`, { params });
  const response = apiResponse.data;

  if (!response) {
    throw new Error("참여 중인 입양 대화 목록을 불러오지 못했습니다.");
  }

  if (response.content?.length) {
    await Promise.all(
        response.content.map(async (item) => {
        if (item.adoptionPost.imageUrl) {
          item.adoptionPost.imageUrl = await getPresignedUrl(item.adoptionPost.imageUrl);
        }
      })
    );
  }
  return response;
};

// 입양 후보자(채팅 상대) 목록 조회
export const getAdoptionCandidates = async (id: number | string): Promise<AdoptionCandidateResponse[]> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionCandidateResponse[]>>(`/adoption/${id}/candidates`);
  return apiResponse.data ?? [];
};

// 입양 완료 처리
export const completeAdoption = async (id: number | string, data: CompleteAdoptionRequest): Promise<void> => {
  await api.post<ApiResponse<void>>(`/adoption/${id}/complete`, data);
};

// 입양 완료 취소
export const cancelCompleteAdoption = async (id: number | string): Promise<void> => {
  await api.post<ApiResponse<void>>(`/adoption/${id}/cancel-complete`);
};
