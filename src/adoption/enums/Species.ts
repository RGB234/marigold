/**
 * 동물 종 Enum
 */
export enum Species {
  DOG = "DOG",
  CAT = "CAT",
  RODENTS = "RODENTS",
  BIRDS = "BIRDS",
  REPTILES = "REPTILES",
  FISH = "FISH",
  OTHER = "OTHER"
}

/**
 * 동물 종 한글 라벨
 */
export const SpeciesLabels: Record<Species, string> = {
  [Species.DOG]: "개",
  [Species.CAT]: "고양이",
  [Species.RODENTS]: "설치류",
  [Species.BIRDS]: "조류",
  [Species.REPTILES]: "파충류",
  [Species.FISH]: "어류",
  [Species.OTHER]: "기타외"
};

/**
 * 동물 종 옵션 배열 (드롭다운 등에서 사용)
 */
export const SpeciesOptions = [
  { value: Species.DOG, label: SpeciesLabels[Species.DOG] },
  { value: Species.CAT, label: SpeciesLabels[Species.CAT] },
  { value: Species.RODENTS, label: SpeciesLabels[Species.RODENTS] },
  { value: Species.BIRDS, label: SpeciesLabels[Species.BIRDS] },
  { value: Species.REPTILES, label: SpeciesLabels[Species.REPTILES] },
  { value: Species.FISH, label: SpeciesLabels[Species.FISH] },
  { value: Species.OTHER, label: SpeciesLabels[Species.OTHER] }
];

