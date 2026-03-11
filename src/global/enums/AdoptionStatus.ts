export enum AdoptionStatus {
    PROCEEDING = 'PROCEEDING',
    RESERVED = 'RESERVED',
    COMPLETED = 'COMPLETED'
}

export const AdoptionStatusLabels: Record<AdoptionStatus, string> = {
    [AdoptionStatus.PROCEEDING]: '모집중',
    [AdoptionStatus.RESERVED]: '예약중',
    [AdoptionStatus.COMPLETED]: '입양완료',
};

export const getAdoptionStatusLabel = (status: AdoptionStatus): string => {
    return AdoptionStatusLabels[status] || '알 수 없음';
};
