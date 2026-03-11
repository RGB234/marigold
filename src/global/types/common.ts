// src/types/common.ts

/**
 * UUID v4 형식의 문자열 (예: "550e8400-e29b-41d4-a716-446655440000")
 */
export type UUID = string;

export type TSID_String = string;
export type TSID_Long = bigint;

export interface Pageable {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;  // 현재 페이지 (0부터 시작)
}

export interface ErrorDetail {
    field: string;
    message: string;
}

export type ISO8601DateString = string; // 예: "2024-01-01T12:00:00Z"
export type ImageUrl = string;          // 이미지 경로