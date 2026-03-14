/**
 * 유효한 Crockford's BASE32 문자열인지 검사
 */
const CROCKFORD_BASE32 = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{13}$/i;

export const validBASE32 = (id: string | null | undefined): boolean => {
  // 1. null, undefined, 빈 문자열 체크
  if (!id) return false;

  // 2. 타입 방어 (런타임 안전성)
  // if (typeof id !== 'string') return false;

  // 3. 정규식 검사 (길이 13자 + 허용 문자 확인)
  return CROCKFORD_BASE32.test(id);
};
