// src/utils/objectUtils.js

/**
 * 객체에서 null, undefined, 빈 문자열('')을 제거하여 반환합니다.
 * @param {Object} params - 원본 파라미터 객체
 * @returns {Object} - 정제된 객체
 */
export const cleanParams = (params) => {
  if (!params) return {};

  return Object.fromEntries(
    Object.entries(params).filter(([_, value]) => {
      // 1. null과 undefined 제거
      if (value == null) return false;

      // 2. 빈 문자열("") 제거 (필요에 따라 주석 처리 가능)
      if (value === "") return false;

      // 3. (선택사항) 배열인데 길이가 0이면 제거 (예: 빈 카테고리 선택)
      if (Array.isArray(value) && value.length === 0) return false;

      return true;
    })
  );
};

/**
 * 
 * @param {*} params - 원본 파라미터 객체
 * @returns {FormData} - 변환된 FormData 객체
 */
export const convertToFormData = (params) => {
  const formData = new FormData();
  Object.entries(params).forEach(([key, value]) => {
    // console.log("key", key);
    // console.log("value", value);
    // null 또는 undefined 제거
    if (value === null || value === undefined) return;

    // 이미지
    if (key === 'images') {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(file => formData.append(key, file));
      }
      return;
    }

    // 이미지가 아닌 경우는 문자열로 저장 
    formData.append(key, String(value));
  });
  return formData;
};
