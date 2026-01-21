<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getUserAdoptions } from '@/api/adoption';
import { useAuthStore } from '@/stores/auth';
import NoImage from '@/assets/images/no-image.jpeg';

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


// Mapper function

const getStatusLabel = (status) => {
    const map = {
        RECRUITING: '모집 중',
        COMPLETED: '입양 완료',
    };
    return map[status] || '모집 중';
};

const getSpeciesLabel = (species) => {
    const map = {
        DOG: '강아지',
        CAT: '고양이',
        RODENTS: '설치류',
        BIRDS: '조류',
        REPTILES: '파충류',
        FISH: '어류',
        OTHER: '기타',
    };
    return map[species] || '기타';
};

const getSexLabel = (sex) => {
    const map = {
        MALE: '남아',
        FEMALE: '여아',
        UNKNOWN: '불명',
        OTHER: '기타',
    };
    return map[sex] || '불명';
};

const getNeuteringLabel = (neutering) => {
    const map = {
        YES: '예',
        NO: '아니오',
        UNKNOWN: '불명',
    };
    return map[neutering] || '불명';
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
                    <span class="status-badge" :class="{ done: item.status === 'DONE' }">
                        {{ getStatusLabel(item.status) }}
                    </span>
                </div>

                <div class="card-body">
                    <div class="card-meta">
                        <span class="species">{{ getSpeciesLabel(item.species) }}</span>
                        <span class="divider">|</span>
                        <span class="date">{{ formatDate(item.createdAt) }}</span>
                    </div>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <div class="card-info">
                        <span>{{ item.age }}살</span> ·
                        <span>{{ getSexLabel(item.sex) }}</span> ·
                        <span>{{ getNeuteringLabel(item.neutering) }}</span> ·
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
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    /* 반응형 그리드 */
    gap: 24px;
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
    flex-direction: column;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-image {
    position: relative;
    width: 100%;
    height: 180px;
    background-color: #eee;
}

.thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* 상태 배지 */
.status-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: #ff9800;
    /* 모집중 컬러 */
    color: white;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.status-badge.done {
    background-color: #888;
    /* 완료 컬러 */
}

/* 카드 내용 */
.card-body {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.card-meta {
    font-size: 12px;
    color: #888;
    margin-bottom: 8px;
}

.card-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
    line-height: 1.4;

    /* 긴 제목 말줄임표 처리 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-info {
    font-size: 13px;
    color: #666;
    margin-top: auto;
    /* 하단 고정 */
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