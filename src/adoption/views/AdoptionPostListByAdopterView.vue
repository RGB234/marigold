<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getAdoptionPostListByAdopter } from '@/adoption/api/adoptionPost.api.ts';
import NoImage from '@/assets/images/no-image.jpeg';
import { SexLabels } from '@/adoption/enums/Sex.ts';
import { SpeciesLabels } from '@/adoption/enums/Species.ts';
import { AdoptionPostResponse, AdoptionPostPageResponse } from '@/adoption/types/adoptionPost';
import {AdoptionPostStatus, getAdoptionStatusLabel} from "@/adoption/enums/AdoptionPostStatus.ts";
import { RouteHelper } from '@/global/router/routeHelper';
import { Long_String } from '@/global/types/common';

const router = useRouter(); 
const route = useRoute();

// 상태 변수
const myAdoptionInfoList = ref<AdoptionPostResponse[]>([]);
const loading = ref(false);

// 서버 사이드 페이지네이션
const currentPage = ref(0);      // 서버 페이지 번호 (0부터 시작)
const totalServerPages = ref(1); // 서버에서 반환한 총 페이지 수
const visiblePageCount = 10;     // 페이지네이션 바에 표시할 페이지 버튼 수

// 작성한 글 목록 불러오기
const fetchMyAdoptions = async (page = 0) => {
    const userId = route.params.userId as string;
    if (!userId) return;

    loading.value = true;
    currentPage.value = page;
    try {
        const data: AdoptionPostPageResponse = await getAdoptionPostListByAdopter(userId, { page, size: 10 });
        myAdoptionInfoList.value = data.content || [];
        totalServerPages.value = data.page.totalPages ?? 1;
    } catch (error) {
        console.error("입양 목록 조회 중 오류 발생:", error);
        myAdoptionInfoList.value = [];
    } finally {
        loading.value = false;
    }
};

// 상세 페이지로 이동
const goToDetail = (id: Long_String) => {
    router.push(RouteHelper.adoption.detail(id.toString()));
};

// 날짜 포맷팅 (YYYY.MM.DD)
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR');
};

// 페이지네이션 바에 표시될 페이지 번호 목록 (0-indexed)
const visiblePages = computed(() => {
  const half = Math.floor(visiblePageCount / 2);
  const start = Math.max(0, currentPage.value - half);
  const end = Math.min(totalServerPages.value - 1, start + visiblePageCount - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

onMounted(() => {
    fetchMyAdoptions(0);
});
</script>

<template>
    <div class="list-container">
        <div class="page-header">
            <h2>내 입양 목록</h2>
            <p>나와 새로운 가족이 된 아이들입니다.</p>
        </div>

        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>목록을 불러오는 중입니다...</p>
        </div>

        <div v-else-if="myAdoptionInfoList.length > 0">
            <div class="card-grid">
                <div v-for="item in myAdoptionInfoList" :key="item.id" class="card" @click="goToDetail(item.id)">
                    <div class="card-image">
                        <img :src="item.imageUrl || NoImage" alt="" class="thumb" />
                    </div>

                    <div class="card-body">
                        <span class="status-badge" :class="{ done: item.status === AdoptionPostStatus.COMPLETED }">
                            {{ getAdoptionStatusLabel(item.status) }}
                        </span>
                        <div class="card-meta">
                            <span class="species">{{ SpeciesLabels[item.species] }}</span>
                            <span class="divider">|</span>
                            <span class="date">{{ formatDate(item.createdAt) }}</span>
                        </div>
                        <h3 class="card-title">{{ item.title }}</h3>
                        <div class="card-info">
                            <span>{{ item.age }}살</span>
                        </div>
                        <div class="card-info">
                            <span>성별</span>
                            <span>{{ SexLabels[item.sex] }}</span>
                        </div>
                        <div class="card-info">
                            <span>지역</span>
                            <span>{{ item.area }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 페이지네이션 추가 -->
            <div class="pagination">
                <button @click="fetchMyAdoptions(currentPage - 1)" :disabled="currentPage === 0">전</button>
                <button
                    v-for="page in visiblePages"
                    :key="page"
                    :class="{ active: currentPage === page }"
                    @click="fetchMyAdoptions(page)"
                >
                    {{ page + 1 }}
                </button>
                <button @click="fetchMyAdoptions(currentPage + 1)" :disabled="currentPage >= totalServerPages - 1">후</button>
            </div>
        </div>

        <div v-else class="empty-state">
            <div class="empty-icon">🐾</div>
            <p>아직 입양한 내역이 없습니다.</p>
        </div>
    </div>
</template>

<style scoped>
.list-container {
    max-width: 800px;
    min-width: max-content;
    width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 40px 20px;
}

.page-header {
    margin-bottom: 30px;
    text-align: center;
}

.page-header h2 {
    font-size: 28px;
    color: #333;
    margin-bottom: 8px;
}

.page-header p {
    color: #666;
}

/* 그리드 레이아웃 */
.card-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 카드 스타일 */
.card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: row;
    /* 가로 배치 */
    height: 200px;
    /* 고정 높이 */
}

.card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-image {
    position: relative;
    width: 200px;
    /* 정사각형 이미지 */
    min-width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    box-sizing: border-box;
}

.thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 상태 배지 */
.status-badge {
    display: inline-block;
    width: fit-content;
    background-color: #ff9800;
    /* 모집중 컬러 */
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 8px;
}

.status-badge.done {
    background-color: #888;
    /* 완료 컬러 */
}

/* 카드 내용 */
.card-body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.card-meta {
    font-size: 13px;
    color: #888;
    margin-bottom: 10px;
}

.card-meta .species {
    font-weight: 600;
    color: #666;
}

.card-meta .divider {
    margin: 0 8px;
    color: #ddd;
}

.card-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 12px;
    line-height: 1.4;

    /* 긴 제목 말줄임표 처리 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-info {
    font-size: 14px;
    color: #666;
    display: flex;
    gap: 8px;
}

.card-info span:first-child {
    color: #999;
    font-weight: 500;
}

/* 로딩 & 빈 상태 */
.loading-state,
.empty-state {
    text-align: center;
    padding: 80px 0;
    color: #888;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ff9800;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

/* pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-top: 30px;
}

.pagination button {
  border: 1px solid #ccc;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  background: white;
}

.pagination button.active {
  background-color: #ff9800;
  color: white;
  border-color: #ff9800;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>