/**
 * 성별 Enum
 */
export enum Sex {
  MALE = "MALE",
  FEMALE = "FEMALE",
  UNKNOWN = "UNKNOWN",
  OTHER = "OTHER"
}

/**
 * 성별 한글 라벨
 */
export const SexLabels: Record<Sex, string> = {
  [Sex.MALE]: "수컷",
  [Sex.FEMALE]: "암컷",
  [Sex.UNKNOWN]: "불명",
  [Sex.OTHER]: "기타"
};

/**
 * 성별 옵션 배열 (드롭다운 등에서 사용)
 */
export const SexOptions = [
  { value: Sex.MALE, label: SexLabels[Sex.MALE] },
  { value: Sex.FEMALE, label: SexLabels[Sex.FEMALE] },
  { value: Sex.UNKNOWN, label: SexLabels[Sex.UNKNOWN] },
  { value: Sex.OTHER, label: SexLabels[Sex.OTHER] }
];

