export enum AdoptionPostStatus {
    PROCEEDING = 'PROCEEDING',
    RESERVED = 'RESERVED',
    COMPLETED = 'COMPLETED'
}

export const AdoptionStatusLabels: Record<AdoptionPostStatus, string> = {
    [AdoptionPostStatus.PROCEEDING]: '모집중',
    [AdoptionPostStatus.RESERVED]: '예약중',
    [AdoptionPostStatus.COMPLETED]: '입양완료',
};

export const getAdoptionStatusLabel = (status: AdoptionPostStatus): string => {
    return AdoptionStatusLabels[status] || '알 수 없음';
};
