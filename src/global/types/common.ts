/**
 * 인프라 및 공통 통신 규격을 정의합니다.
 */

/**
 * UUID v4 형식의 문자열 (예: "550e8400-e29b-41d4-a716-446655440000")
 */
export type UUID = string;

/**
 * TSID (Time-Sorted Unique Identifier) 문자열
 */
export type TSID_String = string; // crockford base32

export type Long_String = string;

export type ImageUrl = string;

/**
 * ISO 8601 날짜 문자열 (예: "2024-01-01T12:00:00Z")
 */
export type ISO8601DateString = string;

/**
 * RFC 9457 Problem Details 오류 응답
 */
export interface ProblemDetail {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    errorCode?: string;
    errors?: Array<ErrorDetail>;
}

/**
 * Spring Pageable 응답 내의 페이지 정보 규격
 */
export interface Pageable {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number; // 현재 페이지 (0부터 시작)
}

/**
 * Spring Page<T> 전체 응답 구조
 */
export interface PageResponse<T> {
    content: T[];
    page: Pageable;
}

/**
 * API 에러 발생 시 상세 필드 에러 정보
 */
export interface ErrorDetail {
    field: string;
    message: string;
}

/**
 * Spring Pageable 요청 파라미터 (공통)
 */
export interface PageableParams {
    page?: number;      // 페이지 번호 (0부터 시작)
    size?: number;      // 페이지 크기
    sort?: string;      // 정렬 기준 필드명
    direction?: string; // 정렬 방향 (ASC/DESC)
}

/**
 * ProblemDetail 타입 가드 함수
 */
export function isProblemDetail(response: unknown): response is ProblemDetail {
    if (typeof response !== 'object' || response === null) {
        return false;
    }

    const candidate = response as Record<string, unknown>;
    return (
        typeof candidate.type === 'string' &&
        typeof candidate.title === 'string' &&
        typeof candidate.status === 'number' &&
        (candidate.detail === undefined || typeof candidate.detail === 'string')
    );
}
