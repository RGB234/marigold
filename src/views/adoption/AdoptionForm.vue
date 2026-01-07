<template>
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
      <div v-if="card.imageUrl">
        <img :src="card.imageUrl" alt="대표이미지" />
      </div>
      <div v-if="card.species" class="info">
        <!-- <label>종</label> -->
        <p>{{ SpeciesLabels[card.species] }}</p>
      </div>
      <div v-if="card.age !== null" class="info">
        <!-- <label>나이</label> -->
        <p>{{ card.age }} 살</p>
      </div>
      <div v-if="card.sex" class="info">
        <!-- <label>성별</label> -->
        <p>{{ SexLabels[card.sex] }}</p>
      </div>
      <div v-if="card.area" class="info">
        <!-- <label>지역</label> -->
        <p>{{ card.area }}</p>
      </div>
    </div>
  </div>
  <div class="btn-container">
    <!-- 작성 버튼 -->
    <button @click="handleWrite()" class="write-btn">글쓰기</button>
  </div>

  <div class="pagination">
    <button @click="safeCurrentPage -= 1">전</button>
    <button
      v-for="page in visiblePages"
      :key="page"
      :class="{ active: safeCurrentPage === page }"
      @click="safeCurrentPage = page"
    >
      {{ page }}
    </button>
    <button @click="safeCurrentPage += 1">후</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "@/api/api";
import router from "@/router";
import { Species, SpeciesLabels, SpeciesOptions } from "@/enums/Species";
import { Sex, SexLabels, SexOptions } from "@/enums/Sex";

// 상수 및 변수
const apiAdoptionInfos = import.meta.env.VITE_API_ADOPTION;

const searchResult = ref([]);
const searchFilters = ref({
  species: undefined, // undefined이면 전체검색
  sex: undefined, // undefined이면 전체검색
});

// 검색 함수
const handleSearch = async () => {
  searchResult.value = []; // 기존 결과 초기화
  currentPage.value = 1; // 페이지를 1로 초기화

  const params = Object.fromEntries(
    // null or undefined 제외
      Object.entries(searchFilters.value).filter(([_, v]) => v != null)
    );
  try {
    const res = await api.get(apiAdoptionInfos, {
      params: params,
    });    
    if (res.data.content) searchResult.value.push(...res.data.content);
  } catch (error) {
    console.error("검색 중 오류 발생:", error);
  }
};

onMounted(async () => {
  await handleSearch(); // 초기 로드 시 검색 실행
});

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
    currentPage.value = Math.min(Math.max(1, value), totalPages.value);
  },
});

// 페이지네이션 바 로직
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

const handleWrite = () => {
  router.push({ name: "Adoption_write" });
};

// 카드 클릭 시 상세 페이지로 이동
const handleCardClick = (card) => {
  router.push({ name: "Adoption_detail", params: { id: String(card.id) } });
};
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
  align-self: center; /* 버튼 가운데 정렬 */
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background-color: #ffffff;
  cursor: pointer;
}

.search-btn:hover {
  background-color: #e0e0e0;
}

/* card */

.card-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
}

.card {
  width: 180px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  h3 {
    margin: 4px;
  }

  p {
    margin: 4px;
  }

  img {
    width: 100%;
    border-radius: 10px;
  }
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.info {
  display: flex;
  justify-content: space-between; /* 라벨과 값 양 끝 정렬 */
  width: 100%;
  margin-bottom: 8px;
  font-family: "Arial", sans-serif;
}

.info label {
  font-weight: 600;
  color: #555;
  flex-shrink: 0; /* 라벨 크기 유지 */
}

.info h3,
.info p {
  margin: 0;
  color: #333;
  text-align: right;
  flex-grow: 1; /* 값이 남은 공간 차지 */
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
  background-color: #eaa221; /* 파란색 */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none; /* a 태그일 경우 */
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
