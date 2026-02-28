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

/**
 * 객체를 FormData로 변환합니다.
 * @param params - 원본 파라미터 객체
 * @returns - 변환된 FormData 객체
 */
export const convertToFormData = (params: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(params).forEach(([key, value]) => {
    // null 또는 undefined 제거
    if (value === null || value === undefined) return;

    // 이미지: File 배열인 경우만 append (빈 배열·null·비파일 값은 전송하지 않음)
    if (key === 'images' || key === 'image') {
      if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
        value.forEach((file: File) => formData.append(key, file));
      } else if (value instanceof File) {
        formData.append(key, value);
      }
      // 그 외(null, 빈 배열, FileList가 아닌 값)는 전송하지 않음
      return;
    }

    // 이미지가 아닌 경우는 문자열로 저장 
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
};
