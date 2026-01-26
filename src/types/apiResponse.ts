// 응답받을 데이터의 형태를 정의
export interface AdoptionDetailResponse {
    id: number;        // UUID가 문자열이라면 string
    writer: {          // 중첩된 객체가 있다면 이렇게 정의
        id: string; // UUID
        nickname: string;
        imageUrl: string;
    };
    createdAt: string;
    modifiedAt: string;
    species: string;
    title: string;
    age: number;
    sex: string;
    area: string;
    weight: number;
    neutering: string;
    features: string;
    imageUrls: string[];
    status: string;
}

export interface AdoptionListResponse {
    content: {
        id: number;
        title: string;
        species: string;
        age: number;
        sex: string;
        area: string;
        imageUrl: string;
        status: string;
        createdAt: string;
    }
}

export interface UserProfileResponse {
    id: string; // UUID
    nickname: string;
    imageUrl: string;
}