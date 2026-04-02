import {
  ImageUrl,
  ISO8601DateString, Long_String,
  PageableParams,
  PageResponse,
  TSID_String
} from "@/global/types/common";
import {Species} from "@/adoption/enums/Species.ts";
import {Sex} from "@/adoption/enums/Sex.ts";
import {Neutering} from "@/adoption/enums/Neutering.ts";
import {AdoptionPostStatus} from "@/adoption/enums/AdoptionPostStatus.ts";

/**
 * 입양 게시글 생성 요청
 */
export interface AdoptionPoseCreateRequest {
  species: Species;
  title: string;
  age: number;
  sex: Sex;
  area: string;
  weight: number;
  neutering: Neutering;
  features: string;
  images: File[];
}

/**
 * 입양 게시글 수정 요청
 */
export interface AdoptionPostUpdateRequest {
  species: Species;
  title: string;
  age: number;
  sex: Sex;
  area: string;
  weight: number;
  neutering: Neutering;
  features: string;
  imageFileNamesToKeep: string[];
  images: File[];
}

/**
 * 입양 목록 검색 필터
 */
export interface AdoptionPostSearchFilter {
  species?: Species;
  sex?: Sex;
}

/**
 * 입양 목록 조회 파라미터 (검색 + 페이징)
 */
export type AdoptionPostSearchParams = AdoptionPostSearchFilter & PageableParams;

/**
 * 입양 목록 단건 응답 (AdoptionInfoResponseDto)
 */
export interface AdoptionPostResponse {
  id: Long_String;
  title: string;
  species: Species;
  age: number;
  sex: Sex;
  area: string;
  imageUrl: string;
  status: AdoptionPostStatus;
  createdAt: ISO8601DateString;
}

/**
 * 입양 목록 페이지 응답
 */
export type AdoptionPostPageResponse = PageResponse<AdoptionPostResponse>;

/**
 * 입양 + 채팅 정보 결합 응답 (AdoptionWithChatDto)
 */
export interface AdoptionPostWithChatResponse {
  adoptionPost: AdoptionPostResponse;
  chatRoomId: Long_String;
  receiverId: TSID_String;
  receiverNickname: string;
  chatCreatedAt: ISO8601DateString;
}

/**
 * 입양 + 채팅 목록 페이지 응답
 */
export type AdoptionPostWithChatPageResponse = PageResponse<AdoptionPostWithChatResponse>;

/**
 * 입양 상세 정보 응답 (AdoptionDetailResponseDto)
 */
export interface AdoptionPostDetailResponse {
  id: Long_String;
  writer: {
    id: TSID_String;
    nickname: string;
    imageUrl: ImageUrl;
  };
  createdAt: ISO8601DateString;
  modifiedAt: ISO8601DateString;
  species: Species;
  title: string;
  age: number;
  sex: Sex;
  area: string;
  weight: number;
  neutering: Neutering;
  features: string;
  imageFileNames: string[];
  imageUrls: ImageUrl[];
  status: AdoptionPostStatus;
  adopter?: {
    id: TSID_String;
    nickname: string;
    imageUrl: ImageUrl | null;
  };
  chatRoomCount: number;
}

export interface AdoptionCandidateResponse {
  id: TSID_String;
  nickname: string;
  imageUrl: ImageUrl | null;
}

export interface CompleteAdoptionRequest {
  adopterId: TSID_String;
}
