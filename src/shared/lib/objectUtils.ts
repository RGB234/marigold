/**
 * 객체에서 null, undefined, 빈 문자열('')을 제거하여 반환합니다.
 * @param params - 원본 파라미터 객체
 * @returns - 정제된 객체
 */
export const cleanParams = (params: Record<string, any> | null | undefined): Record<string, any> => {
  if (!params) return {};

  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => {
      // null과 undefined 제거
      if (value == null) return false;

      if (value === "") return false;

      // 배열인데 길이가 0이면 제거 (예: 빈 카테고리 선택)
      if (Array.isArray(value) && value.length === 0) return false;

      return true;
    })
  );
};
