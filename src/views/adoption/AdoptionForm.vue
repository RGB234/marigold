<template>
  <div class="filter-container">
    <div class="filter">
      <div class="filter-row">
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
      </div>

      <div class="filter-row">
        <label for="type">품종</label>
        <select id="type">
          <option>전체</option>
          <option>개</option>
          <option>고양이</option>
          <option>기타</option>
        </select>
      </div>

      <button class="search-btn">검색</button>
    </div>
  </div>
  <div class="card-container">
    <div v-for="(card, index) in visibleCards" :key="index" class="card">
      <img :src="card.img" :alt="card.name" />
      <!-- <div v-if="card.name" class="info">
        <label>이름</label>
        <h3>{{ card.name }}</h3>
      </div> -->
      <div v-if="card.species" class="info">
        <label>종</label>
        <p>{{ card.species }}</p>
      </div>
      <div v-if="card.age !== null" class="info">
        <label>나이</label>
        <p>{{ card.age }}</p>
      </div>
      <div v-if="card.sex" class="info">
        <label>성별</label>
        <p>{{ card.sex }}</p>
      </div>
      <div v-if="card.area" class="info">
        <label>지역</label>
        <p>{{ card.area }}</p>
      </div>
    </div>
  </div>
  <div class="btn-container">
    <!-- 작성 버튼 -->
    <router-link :to="adoptionWriteUrl" class="write-btn"> 글쓰기 </router-link>
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
import api from "@/api";

// 상수 및 변수
const adoptionWriteUrl = import.meta.env.VITE_APP_ADOPTION_WRITE;
const apiAdoptionInfos = import.meta.env.VITE_APP_API_ADOPTION_ALL;

const cardData = ref([]);

onMounted(async () => {
  const res = await api.get(apiAdoptionInfos);

  if (res.data.list) cardData.value.push(...res.data.list);
});

// 한 페이지 당 보여줄 카드 수
const cardsPerPage = ref(4);
// 페이지네이션 바에 표시될 페이지 수
const visiblePageCount = 10;
// 총 페이지 수
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(cardData.value.length / cardsPerPage.value));
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

  return cardData.value.slice(start, end);
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
