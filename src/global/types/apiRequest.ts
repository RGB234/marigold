import { Neutering } from "@/global/enums/Neutering";
import { Sex } from "@/global/enums/Sex";
import { Species } from "@/global/enums/Species";

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

export interface AdoptionSearchFilter {
  species?: Species;
  sex?: Sex;
}

// Spring Pageable 파라미터 (모두 optional - 기본값은 백엔드 @PageableDefault에서 설정)
export interface PageableParams {
  page?: number;      // 페이지 번호 (0부터 시작)
  size?: number;      // 페이지 크기
  sort?: string;      // 정렬 기준 필드명
  direction?: string; // 정렬 방향 (ASC/DESC)
}

export type GetAdoptionListParams = AdoptionSearchFilter & PageableParams;

