export enum Neutering {
    YES = "YES",
    NO = "NO",
    UNKNOWN = "UNKNOWN"
}

export const NeuteringLabels: Record<Neutering, string> = {
    [Neutering.YES]: "중성화O",
    [Neutering.NO]: "중성화X",
    [Neutering.UNKNOWN]: "불명"
}
