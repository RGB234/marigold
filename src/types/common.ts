// src/types/common.ts

/**
 * UUID v4 형식의 문자열 (예: "550e8400-e29b-41d4-a716-446655440000")
 */
export type UUID = string;

/**
 * (선택사항) 그 외 자주 쓰는 공통 타입들도 이곳에 정의하면 좋습니다.
 */
export type ISO8601DateString = string; // 예: "2024-01-01T12:00:00Z"
export type ImageUrl = string;          // 이미지 경로