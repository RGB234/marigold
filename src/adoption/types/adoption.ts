import { Species, Sex, Neutering, AdoptionStatus } from "@/global/enums";
import { PageResponse, PageableParams, TSID_String, ISO8601DateString, ImageUrl } from "@/global/types/common";

/**
 * 입양 게시글 생성 요청
 */
export interface AdoptionCreateRequest {
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
export interface AdoptionUpdateRequest {
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
export interface AdoptionSearchFilter {
  species?: Species;
  sex?: Sex;
}

/**
 * 입양 목록 조회 파라미터 (검색 + 페이징)
 */
export type GetAdoptionListParams = AdoptionSearchFilter & PageableParams;

/**
 * 입양 목록 단건 응답 (AdoptionInfoResponseDto)
 */
export interface AdoptionItemResponse {
  id: number;
  title: string;
  species: Species;
  age: number;
  sex: Sex;
  area: string;
  imageUrl: ImageUrl;
  status: AdoptionStatus;
  createdAt: ISO8601DateString;
}

/**
 * 입양 목록 페이지 응답
 */
export type AdoptionPageResponse = PageResponse<AdoptionItemResponse>;

/**
 * 입양 + 채팅 정보 결합 응답 (AdoptionWithChatDto)
 */
export interface AdoptionWithChatResponse {
  adoptionInfo: AdoptionItemResponse;
  chatRoomId: number;
  receiverId: TSID_String;
  receiverNickname: string;
  chatCreatedAt: ISO8601DateString;
}

/**
 * 입양 + 채팅 목록 페이지 응답
 */
export type AdoptionWithChatPageResponse = PageResponse<AdoptionWithChatResponse>;

/**
 * 입양 상세 정보 응답 (AdoptionDetailResponseDto)
 */
export interface AdoptionDetailResponse {
  id: BigInt;
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
  status: AdoptionStatus;
}
