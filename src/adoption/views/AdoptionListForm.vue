<template>
  <div class="filter-container">
    <div class="filter-card">
      <div class="filter-group">
        <div class="filter-item">
          <label for="species">품종</label>
          <div class="select-wrapper">
            <select id="species" v-model="searchFilters.species">
              <option :value="undefined">전체 품종</option>
              <option v-for="option in SpeciesOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="filter-item">
          <label for="sex">성별</label>
          <div class="select-wrapper">
            <select id="sex" v-model="searchFilters.sex">
              <option :value="undefined">모든 성별</option>
              <option v-for="option in SexOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <button class="search-btn" @click="handleFilterSearch">
        <span class="icon">🔍</span> 검색하기
      </button>
    </div>
  </div>

  <div class="card-container">
    <div v-for="(card, index) in visibleCards" :key="index" class="card" @click="handleCardClick(card)">
      <div class="card-image">
        <img :src="card.imageUrl" alt="대표이미지" class="thumb" />
      </div>

      <div class="card-body">
        <span class="status-badge" :class="card.status">
            {{ getAdoptionStatusLabel(card.status) }}
        </span>
        <div class="card-meta">
          <span class="species">{{ SpeciesLabels[card.species] }}</span>
          <span class="divider">|</span>
          <span class="date">{{ card.createdAt ? new Date(card.createdAt).toLocaleDateString('ko-KR') : '' }}</span>
        </div>
        <h3 class="card-title">{{ card.title }}</h3>
        <div class="card-info">
          <span>{{ card.age }}살</span>
        </div>
        <div class="card-info">
          <span>성별</span>
          <span>{{ SexLabels[card.sex] }}</span>
        </div>
        <div class="card-info">
          <span>지역</span>
          <span>{{ card.area }}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="btn-container">
    <!-- 작성 버튼 -->
    <button @click="handleWrite()" class="write-btn">글쓰기</button>
  </div>

  <div class="pagination">
    <button @click="handleSearch(currentPage - 1)" :disabled="currentPage === 0">전</button>
    <button
      v-for="page in visiblePages"
      :key="page"
      :class="{ active: currentPage === page }"
      @click="handleSearch(page)"
    >
      {{ page + 1 }}
    </button>
    <button @click="handleSearch(currentPage + 1)" :disabled="currentPage >= totalServerPages - 1">후</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { SpeciesLabels, SpeciesOptions } from "@/global/enums/Species";
import { SexLabels, SexOptions } from "@/global/enums/Sex";
import { getAdoptionStatusLabel } from "@/global/enums/AdoptionStatus";
import { cleanParams } from "@/global/utils/objectUtils";
import { getAdoptionList } from "@/adoption/api/adoption.api";
import {
  AdoptionItemResponse,
  AdoptionPageResponse
} from "@/adoption/types/adoption";

// ==========================================
// 데이터 호출 및 상태 관리
// ==========================================

const router = useRouter();

const searchResult = ref<AdoptionItemResponse[]>();
const searchFilters = ref<{ species?: string; sex?: string }>({
  species: undefined, // undefined이면 전체검색
  sex: undefined,     // undefined이면 전체검색
});

// ==========================================
// 서버 사이드 페이지네이션
// ==========================================

const currentPage = ref(0);      // 서버 페이지 번호 (0부터 시작)
const totalServerPages = ref(1); // 서버에서 반환한 총 페이지 수
const totalElements = ref(0);    // 서버에서 반환한 총 아이템 수
const visiblePageCount = 10;     // 페이지네이션 바에 표시할 페이지 버튼 수

// page를 인자로 받아 서버에서 해당 페이지 데이터를 불러옴
const handleSearch = async (page = 0) => {
  currentPage.value = page;
  searchResult.value = [];
  try {
    const params = { ...cleanParams(searchFilters.value), page };
    const data: AdoptionPageResponse = await getAdoptionList(params);

    searchResult.value = data.content ?? [];

    totalServerPages.value = data.page.totalPages ?? 1;
    totalElements.value = data.page.totalElements ?? 0;
  } catch (error) {
    console.error("검색 중 오류 발생:", error);
  }
};

// 검색 필터 변경 후 1페이지부터 재검색
const handleFilterSearch = () => {
  handleSearch(0);
};

// 페이지네이션 바에 표시될 페이지 번호 목록 (0-indexed)
const visiblePages = computed(() => {
  const half = Math.floor(visiblePageCount / 2);
  const start = Math.max(0, currentPage.value - half);
  const end = Math.min(totalServerPages.value - 1, start + visiblePageCount - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// 현재 페이지에 표시되는 카드 (서버가 이미 페이지 단위로 반환)
const visibleCards = computed(() => searchResult.value);

// ==========================================
// 기타 이벤트 핸들러
// ==========================================

const handleWrite = () => {
  router.push({ name: "Adoption_write" });
};

// 카드 클릭 시 상세 페이지로 이동
const handleCardClick = (card: any) => {
  router.push({ name: "Adoption_detail", params: { id: String(card.id) } });
};

onMounted(async () => {
  await handleSearch(0); // 초기 로드 시 첫 페이지 검색
});
</script>

<style lang="css" scoped>
/* search filter */

.filter-container {
  max-width: 800px;
  min-width: max-content;
  width: 100%;
  box-sizing: border-box;
  margin: 3rem auto;
  display: flex;
  justify-content: center;
  padding: 0 1rem;
}

.filter-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: flex-end; /* 버튼과 하단 정렬 */
  gap: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-width: 800px;
  width: 100%;
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.filter-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
  margin-left: 2px;
}

.select-wrapper {
  position: relative;
}

select {
  width: 100%;
  padding: 0.625rem 1rem;
  font-size: 1rem;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  background-color: #fff;
  color: #2d3748;
  appearance: none; /* 기본 화살표 숨김(필요시 커스텀 가능) */
  transition: all 0.2s;
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: #eaa221;
  box-shadow: 0 0 0 3px rgba(234, 162, 33, 0.1);
}

.search-btn {
  background-color: #eaa221;
  color: white;
  border: none;
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  white-space: nowrap;
  height: 42px; /* select 박스와 높이 맞춤 */
}

.search-btn:hover {
  background-color: #d6921e;
}

.search-btn:active {
  transform: scale(0.98);
}

/* 반응형: 모바일에서는 세로로 나열 */
@media (max-width: 640px) {
  .filter-card {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group {
    flex-direction: column;
  }
}

/* card */

.card-container {
  max-width: 800px;
  min-width: max-content;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.status-badge.COMPLETED {
    background-color: #888;
    /* 완료 컬러 */
}

.status-badge.RESERVED {
    background-color: #2196f3;
    /* 예약중 컬러 (파랑) */
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
  margin: 0 0 12px 0;
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

.btn-container {
  margin: 20px;
  display: flex;
  justify-content: center;
}

/* button */
.write-btn {
  display: inline-block;
  padding: 12px 18px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background-color: #eaa221;
  /* 파란색 */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  /* a 태그일 경우 */
  transition: background-color 0.3s, transform 0.2s;
}

/* 마우스 오버 효과 */
.write-btn:hover {
  transform: scale(1.05);
}

/* 클릭 효과 */
.write-btn:active {
  transform: scale(0.95);
}

/* pagination */

.pagination {
  display: flex;
  justify-content: center;
  gap: 5px;
  margin: 2rem 0rem 2rem 0rem;
}

.pagination button {
  border: 1px solid #ccc;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.pagination button.active {
  background-color: green;
  color: white;
}
</style>
