/**
 * 문자열이 유효한 UUID 형식인지 검사하는 헬퍼 함수
 * (UUID v4, v7 등 일반적인 UUID 형식 모두 호환)
 */
export const isValidUUID = (id: string): boolean => {
    // 1. null이나 undefined, 혹은 문자열이 아닌 경우 즉시 실패
    if (!id || typeof id !== 'string') return false;
  
    // 2. UUID 정규식 패턴 (대소문자 구분 없음 'i')
    // 패턴: 8자리-4자리-4자리-4자리-12자리
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuidRegex2 = /^[0-9a-f]{32}$/i;
    return uuidRegex.test(id) || uuidRegex2.test(id);
  };

