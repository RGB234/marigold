<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import router from '@/router';

import { Species, SpeciesLabels, SpeciesOptions } from "@/enums/Species";
import { Sex, SexLabels, SexOptions } from "@/enums/Sex";
import { Neutering, NeuteringLabels, NeuteringOptions } from "@/enums/Neutering";
import { getAdoptionDetail } from '@/api/adoption';

const route = useRoute();

const loading = ref(true);
const detail = ref(null);

// Enum 한글 변환용 맵 (필요에 따라 수정)
const enumMap = {
    DOG: '강아지',
    CAT: '고양이',
    MALE: '수컷',
    FEMALE: '암컷',
    UNKNOWN: '미상',
    DONE: '완료',
    NOT_DONE: '미완료',
    // ... 기타 필요한 값
};

const translate = (labels, key) => labels[key] || key;

// 날짜 포맷팅 함수 (YYYY-MM-DD HH:mm)
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const fetchDetail = async (id) => {
    try {
        loading.value = true;
        const responseData = await getAdoptionDetail(id); // 실제 API 호출
        detail.value = responseData;
        loading.value = false;

        // // [테스트용 더미 데이터] - 실제 연동 시 삭제하세요
        // setTimeout(() => {
        //     detail.value = {
        //         id: 'uuid-1234',
        //         writer: { nickname: '멍냥지킴이', email: 'test@test.com' },
        //         createdAt: '2026-01-05T10:00:00',
        //         modifiedAt: '2026-01-06T14:30:00',
        //         species: 'DOG',
        //         name: '초코',
        //         age: 2,
        //         sex: 'MALE',
        //         area: '서울시 강남구',
        //         weight: 5.4,
        //         neutering: 'DONE',
        //         features: '사람을 너무 좋아하고 활발한 성격입니다. 산책을 하루에 2번 시켜주셔야 해요. 배변 훈련 완료되었습니다.',
        //         // imageUrl: '...' // 이미지가 있다면 여기에
        //     };
        //     loading.value = false;
        // }, 500);
    } catch (error) {
        router.push({ name: 'Adoption' }); // 목록으로 이동
    }
};

onMounted(() => {
    const id = route.params.id;
    fetchDetail(id);
});
</script>

<template>
    <div class="detail-container">
        <div v-if="loading" class="loading">
            데이터를 불러오는 중입니다...
        </div>

        <div v-else-if="detail" class="content-wrapper">

            <div class="header-section">
                <div class="title-row">
                    <span class="badge species">{{ translate(SpeciesLabels, detail.species) }}</span>
                    <h1 class="name">{{ detail.name }}</h1>
                </div>
                <div class="meta-info">
                    <span>작성자: {{ detail.writer?.nickname || '알 수 없음' }}</span>
                    <span class="divider">|</span>
                    <span>등록일: {{ formatDate(detail.createdAt) }}</span>
                </div>
            </div>

            <hr class="separator" />

            <div class="info-grid">
                <div class="image-container">
                    <div v-for="imageUrl in detail.imageUrls" :key="imageUrl">
                        <img :src="imageUrl" alt="이미지" />
                    </div>
                </div>
                <div class="info-item">
                    <span class="label">나이</span>
                    <span class="value">{{ detail.age }}살</span>
                </div>
                <div class="info-item">
                    <span class="label">성별</span>
                    <span class="value">{{ translate(SexLabels, detail.sex) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">몸무게</span>
                    <span class="value">{{ detail.weight }} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">중성화</span>
                    <span class="value">{{ translate(NeuteringLabels, detail.neutering) }}</span>
                </div>
                <div class="info-item full-width">
                    <span class="label">보호 지역</span>
                    <span class="value">{{ detail.area }}</span>
                </div>
            </div>

            <hr class="separator" />

            <div class="features-section">
                <h3>특징 및 상세 설명</h3>
                <p class="features-text">
                    {{ detail.features }}
                </p>
            </div>

            <div class="button-group">
                <button class="btn secondary" @click="router.back()">목록으로</button>
                <button class="btn primary">입양 신청하기</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 컨테이너 스타일 */
.detail-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.loading {
    text-align: center;
    padding: 50px;
    color: #888;
}

/* 헤더 섹션 */
.header-section {
    margin-bottom: 20px;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.badge {
    background-color: #ffe082;
    /* 포인트 컬러 */
    color: #333;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
}

.name {
    font-size: 28px;
    margin: 0;
    color: #333;
}

.meta-info {
    font-size: 14px;
    color: #888;
}

.divider {
    margin: 0 8px;
    color: #ddd;
}

/* 구분선 */
.separator {
    border: 0;
    height: 1px;
    background-color: #eee;
    margin: 24px 0;
}

/* 정보 그리드 */
.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    /* 2열 배치 */
    gap: 20px;
    background-color: #f9f9f9;
    padding: 24px;
    border-radius: 8px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.info-item.full-width {
    grid-column: span 2;
    /* 꽉 차게 */
}

/* 이미지 컨테이너 */
.image-container {
    grid-column: span 2;
    /* 전체 너비 사용 */
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    padding: 16px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-container > div {
    flex: 0 0 auto;
    max-width: 200px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.image-container > div:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-container img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
    cursor: pointer;
}

.label {
    font-size: 13px;
    color: #666;
    font-weight: 500;
}

.value {
    font-size: 16px;
    color: #333;
    font-weight: 600;
}

/* 특징 섹션 */
.features-section h3 {
    font-size: 18px;
    margin-bottom: 16px;
    color: #333;
}

.features-text {
    line-height: 1.6;
    color: #444;
    white-space: pre-wrap;
    /* 줄바꿈 유지 */
}

/* 버튼 그룹 */
.button-group {
    margin-top: 40px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.btn {
    padding: 10px 24px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    border: none;
    font-size: 15px;
    transition: background 0.2s;
}

.btn.primary {
    background-color: #ff9800;
    /* 메인 테마 컬러 */
    color: white;
}

.btn.primary:hover {
    background-color: #f57c00;
}

.btn.secondary {
    background-color: #f0f0f0;
    color: #333;
}

.btn.secondary:hover {
    background-color: #e0e0e0;
}

/* 모바일 대응 */
@media (max-width: 600px) {
    .info-grid {
        grid-template-columns: 1fr;
        /* 모바일은 1열 */
    }

    .info-item.full-width {
        grid-column: span 1;
    }

    .image-container {
        grid-column: span 1;
    }

    .image-container > div {
        max-width: 100%;
        /* 모바일에서는 전체 너비 */
    }

    .image-container img {
        height: 250px;
        /* 모바일에서 이미지 높이 증가 */
    }
}
</style>