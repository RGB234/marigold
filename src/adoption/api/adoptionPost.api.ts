import api from "@/global/api";
import { ApiResponse, Long_String, PageableParams, TSID_String } from "@/global/types/common";
import {
  AdoptionPostPageResponse, AdoptionPostDetailResponse,
  AdoptionPostSearchParams,
  AdoptionCandidateResponse,
  CompleteAdoptionRequest,
  AdoptionPostResponse,
  AdoptionCommentResponse,
} from "@/adoption/types/adoptionPost";
import defaultProfileImage from '@/assets/images/default-profile.png';

// 생성
export const createAdoptionPost = async (formData: FormData): Promise<ApiResponse<{ id: Long_String }>> => {
  const {data: apiResponse} = await api.post<ApiResponse<{ id: Long_String }>>("/adoption", formData, {
    handledErrorStatuses: [400],
  });
  return apiResponse;
};

// 수정
export const updateAdoptionPost = async (id: Long_String, formData: FormData): Promise<void> => {
  await api.patch<ApiResponse<void>>(`/adoption/${id}`, formData, {
    handledErrorStatuses: [400],
  });
};

// 삭제
export const deleteAdoptionPost = async (id: Long_String): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/adoption/${id}`);
};

// 입양 상태 변경
export const updateAdoptionPostStatus = async (id: Long_String, status: string): Promise<void> => {
    const params = { status };
    await api.patch<ApiResponse<void>>(`/adoption/${id}/status`, null, { params });
};


export const getAdoptionPostSummary = async (id: Long_String): Promise<AdoptionPostResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostResponse>>(`/adoption/${id}/summary`);

  if (!apiResponse.data) {
    throw new Error("입양 게시글 데이터를 불러오지 못했습니다.");
  }

  return apiResponse.data;
};


// 상세보기
export const getAdoptionPostDetail = async (id: Long_String): Promise<AdoptionPostDetailResponse> => {
  const {data : apiResponse} = await api.get<ApiResponse<AdoptionPostDetailResponse>>(`/adoption/${id}`, {
    handledErrorStatuses: [410],
  });
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
export const getAdoptionPostListByWriter = async (userId: TSID_String, params?: PageableParams): Promise<AdoptionPostPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostPageResponse>>(`/adoption/writer/${userId}`, { params });
  const page = apiResponse.data;

  if (!page) {
    throw new Error("작성글 목록 데이터를 불러오지 못했습니다.");
  }

  return page;
};

export const getAdoptionPostListByAdopter = async (userId: TSID_String, params?: PageableParams): Promise<AdoptionPostPageResponse> => {
  const {data: apiResponse} = await api.get<ApiResponse<AdoptionPostPageResponse>>(`/adoption/adopter/${userId}`, { params });
  const page = apiResponse.data;

  if (!page) {
    throw new Error("입양 목록 데이터를 불러오지 못했습니다.");
  }

  return page;
};


// 입양 후보자(채팅 상대) 목록 조회
export const getAdoptionCandidates = async (id: Long_String): Promise<AdoptionCandidateResponse[]> => {
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
export const completeAdoption = async (id: Long_String, data: CompleteAdoptionRequest): Promise<void> => {
  await api.post<ApiResponse<void>>(`/adoption/${id}/complete`, data);
};

// 입양 완료 취소
export const cancelCompleteAdoption = async (id: Long_String): Promise<void> => {
  await api.post<ApiResponse<void>>(`/adoption/${id}/cancel-complete`);
};

// 댓글 목록 조회
export const getAdoptionComments = async (postId: Long_String): Promise<AdoptionCommentResponse[]> => {
  const { data: apiResponse } = await api.get<ApiResponse<AdoptionCommentResponse[]>>(`/adoption/${postId}/comments`);
  const comments = apiResponse.data || [];
  
  // 모든 작성자의 이미지가 없으면 기본 프로필로 설정
  const setDefaultImage = (comment: AdoptionCommentResponse) => {
    if (comment.writer && !comment.writer.imageUrl) {
      comment.writer.imageUrl = defaultProfileImage;
    }
    if (comment.children && comment.children.length > 0) {
      comment.children.forEach(setDefaultImage);
    }
  };
  comments.forEach(setDefaultImage);
  
  return comments;
};

// 댓글 생성
export const createAdoptionComment = async (postId: Long_String, formData: FormData): Promise<ApiResponse<{ id: Long_String }>> => {
  const { data: apiResponse } = await api.post<ApiResponse<{ id: Long_String }>>(`/adoption/${postId}/comments`, formData);
  return apiResponse;
};

// 댓글 수정
export const updateAdoptionComment = async (
  postId: Long_String,
  commentId: Long_String,
  formData: FormData,
): Promise<void> => {
  await api.patch<ApiResponse<void>>(`/adoption/${postId}/comments/${commentId}`, formData, {
    handledErrorStatuses: [400],
  });
};

// 댓글 삭제
export const deleteAdoptionComment = async (postId: Long_String, commentId: Long_String): Promise<void> => {
  await api.delete<ApiResponse<void>>(`/adoption/${postId}/comments/${commentId}`);
};
