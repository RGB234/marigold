<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getUserAdoptions } from '@/api/adoption';
import { useAuthStore } from '@/stores/auth';
import NoImage from '@/assets/images/no-image.jpeg';
import { CompletedLabels } from '@/enums/Completed';
import { SexLabels } from '@/enums/Sex';
import { SpeciesLabels } from '@/enums/Species';

const router = useRouter(); 

// 상태 변수
const myAdoptions = ref([]);
const loading = ref(false);

const getCurrentUserId = () => {
    const authStore = useAuthStore();
    return authStore.userId || '';
};

// 작성한 글 목록 불러오기
const fetchMyAdoptions = async (UUID) => {
    loading.value = true;
    try {
        const data = await getUserAdoptions(UUID);
        myAdoptions.value = data.content || [];
    } catch (error) {
        console.error("작성한 글 목록 조회 중 오류 발생:", error);
        myAdoptions.value = [];
    } finally {
        loading.value = false;
    }
};

// 상세 페이지로 이동
const goToDetail = (id) => {
    router.push({ name: 'Adoption_detail', params: { id } });
};

// 날짜 포맷팅 (YYYY.MM.DD)
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR');
};

onMounted(() => {
    const uuid = getCurrentUserId();
    if (uuid) {
        fetchMyAdoptions(uuid);
    } else {
        alert("로그인이 필요한 서비스입니다.");
        router.push({ name: 'Login' });
    }
});
</script>

<template>
    <div class="list-container">
        <div class="page-header">
            <h2>내가 쓴 입양 공고</h2>
        </div>

        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>목록을 불러오는 중입니다...</p>
        </div>

        <div v-else-if="myAdoptions.length > 0" class="card-grid">
            <div v-for="item in myAdoptions" :key="item.id" class="card" @click="goToDetail(item.id)">
                <div class="card-image">
                    <img :src="item.imageUrl || NoImage" alt="" class="thumb" />
                </div>

                <div class="card-body">
                    <span class="status-badge" :class="{ done: item.completed }">
                        {{ CompletedLabels[item.completed] }}
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

        <div v-else class="empty-state">
            <div class="empty-icon">📝</div>
            <p>아직 작성한 입양 공고가 없습니다.</p>
        </div>
    </div>
</template>

<style scoped>
.list-container {
    max-width: 1000px;
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

.btn-write {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #ff9800;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

.btn-write:hover {
    background-color: #f57c00;
}
</style>