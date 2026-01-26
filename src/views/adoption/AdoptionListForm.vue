<template>
  <LoadingOverlay v-if="loading"></LoadingOverlay>
  <div class="filter-container">
    <div class="filter">
      <!-- <div class="filter-row">
        <label for="region1">지역</label>
        <select id="region1">
          <option>전체</option>
          <option>서울</option>
          <option>부산</option>
        </select>

        <select id="region2">
          <option>전체</option>
          <option>강남</option>
          <option>마포</option>
        </select>

        <select id="region3">
          <option>전체</option>
          <option>1구</option>
          <option>2구</option>
        </select>
      </div> -->

      <div class="filter-row">
        <label for="species">품종</label>
        <select id="species" v-model="searchFilters.species">
          <option :value="undefined">전체</option>
          <option v-for="option in SpeciesOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="filter-row">
        <label for="sex">성별</label>
        <select id="sex" v-model="searchFilters.sex">
          <option :value="undefined">전체</option>
          <option v-for="option in SexOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <button class="search-btn" @click="handleSearch">검색</button>
    </div>
  </div>

  <div class="card-container">
    <div v-for="(card, index) in visibleCards" :key="index" class="card" @click="handleCardClick(card)">
      <div class="card-image">
        <img :src="card.imageUrl" alt="대표이미지" class="thumb" />
      </div>

      <div class="card-body">
        <span class="status-badge" :class="{ completed: card.completed }">
          <!-- {{ getStatusLabel(card.completed) }} -->
            {{ CompletedLabels[card.completed] }}
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
    <button @click="safeCurrentPage -= 1">전</button>
    <button v-for="page in visiblePages" :key="page" :class="{ active: safeCurrentPage === page }"
      @click="safeCurrentPage = page">
      {{ page }}
    </button>
    <button @click="safeCurrentPage += 1">후</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/api/api";
import { useRouter } from "vue-router";
import { Species, SpeciesLabels, SpeciesOptions } from "@/enums/Species";
import { Sex, SexLabels, SexOptions } from "@/enums/Sex";
import { CompletedLabels } from "@/enums/Completed";
import { cleanParams } from "@/utils/objectUtils";

import { getAdoptionList } from "@/api/adoption";

// ==========================================
// 데이터 호출 및 상태 관리
// ==========================================

const router = useRouter();

const searchResult = ref([]);
const searchFilters = ref({
  species: undefined, // undefined이면 전체검색
  sex: undefined, // undefined이면 전체검색
});

const loading = ref(false);

const handleSearch = async () => {
  searchResult.value = []; // 기존 결과 초기화
  currentPage.value = 1; // 페이지를 1로 초기화

  loading.value = true;

  try {
    const params = cleanParams(searchFilters.value);
    const data = await getAdoptionList(params)
    if (data.content) searchResult.value.push(...data.content);
  } catch (error) {
    console.error("검색 중 오류 발생:", error);
    alert("검색 중 오류가 발생했습니다.");
    throw error;
  } finally {
    loading.value = false;
  }
};

// ==========================================
// 페이지네이션 바 로직
// ==========================================

// 한 페이지 당 보여줄 카드 수
const cardsPerPage = ref(4);
// 페이지네이션 바에 표시될 페이지 수
const visiblePageCount = 10;
// 총 페이지 수
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(searchResult.value.length / cardsPerPage.value));
});
// 현재 선택된 페이지
const currentPage = ref(1);
// 페이지 선택 유효한 범위 내로 제한
const safeCurrentPage = computed({
  get() {
    return currentPage.value;
  },
  set(value) {
    currentPage.value = Math.min(Math.max(1, value), totalPages.value); // 1 ~ totalPages
  },
});

// 페이지네이션 바 로직
// 현재 페이지 앞뒤로 다른 페이지 보여줌
const visiblePages = computed(() => {
  const chunk = Math.floor(visiblePageCount / 2);
  const startPage = Math.max(1, safeCurrentPage.value - chunk);
  const endPage = Math.min(totalPages.value, safeCurrentPage.value + chunk);
  return Array.from(
    { length: endPage - startPage + 1 },
    (value, index) => startPage + index
  );
});

// 현재 페이지에 표시되는 카드
const visibleCards = computed(() => {
  const start = (safeCurrentPage.value - 1) * cardsPerPage.value;
  const end = start + cardsPerPage.value;

  return searchResult.value.slice(start, end);
});

// ==========================================
// 기타 이벤트 핸들러
// ==========================================

const handleWrite = () => {
  router.push({ name: "Adoption_write" });
};

// 카드 클릭 시 상세 페이지로 이동
const handleCardClick = (card) => {
  router.push({ name: "Adoption_detail", params: { id: String(card.id) } });
};

onMounted(async () => {
  await handleSearch(); // 초기 로드 시 검색 실행
});
</script>

<style lang="css" scoped>
/* search filter */

div.filter-container {
  margin-top: 3rem;
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
}

.filter {
  border: 2px solid #eaa221;
  padding: 1rem;
  width: 500px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-radius: 6px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    width: 80px;
    font-weight: 500;
  }
}

select {
  padding: 0.3rem 0.7rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
}

.search-btn {
  width: 100px;
  align-self: center;
  /* 버튼 가운데 정렬 */
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.search-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #f5f5f5;
}

select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: #f5f5f5;
}

/* card */

.card-container {
  max-width: 1000px;
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

.status-badge.completed {
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
