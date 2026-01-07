export enum Neutering {
    YES = "YES",
    NO = "NO",
    UNKNOWN = "UNKNOWN"
}

export const NeuteringLabels: Record<Neutering, string> = {
    [Neutering.YES]: "예",
    [Neutering.NO]: "아니오",
    [Neutering.UNKNOWN]: "모름"
}

export const NeuteringOptions: Record<Neutering, string> = {
    [Neutering.YES]: "예",
    [Neutering.NO]: "아니오",
    [Neutering.UNKNOWN]: "모름"
}