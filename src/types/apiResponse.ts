// 응답받을 데이터의 형태를 정의

import { Neutering } from "@/enums/Neutering";
import { ErrorDetail, Pageable } from "./common";
import { Sex } from "@/enums/Sex";
import { Species } from "@/enums/Species";

// 백엔드 공통 응답 래퍼 (ApiResponse<T>)
export interface ApiResponse<T> {
    success: boolean;
    timestamp: string;
    status: number;
    message: string;
    data?: T;
    errorCode?: string;
    errors? : Array<ErrorDetail>;
}

// Spring Page<T> 응답 구조
export interface PageResponse<T extends object> {
    content: T[];
    page: Pageable;
}

// 입양 목록 단건 항목 (AdoptionInfoResponseDto)
export interface AdoptionItemResponse {
    id: number;
    title: string;
    species: Species;
    age: number;
    sex: Sex;
    area: string;
    imageUrl: string;
    completed: boolean;
    createdAt: string;
}

// 입양 목록 응답 (Page<AdoptionInfoResponseDto>)
export type AdoptionListResponse = PageResponse<AdoptionItemResponse>;

// 입양 상세 응답 (AdoptionDetailResponseDto)
export interface AdoptionDetailResponse {
    id: number;
    writer: {
        id: string;       // TSID: @JsonSerialize(using = ToStringSerializer.class) → String
        nickname: string;
        imageUrl: string;
    };
    createdAt: string;
    modifiedAt: string;
    species: Species;
    title: string;
    age: number;
    sex: Sex;
    area: string;
    weight: number;
    neutering: Neutering;
    features: string;
    imageFileNames: string[]; // original file names
    imageUrls: string[]; // presigned urls
    completed: boolean;
}

// 유저 프로필 응답 (UserInfoDto)
export interface UserProfileResponse {
    id: string;       // TSID: @JsonSerialize(using = ToStringSerializer.class) → String
    nickname: string;
    imageUrl: string;
}
