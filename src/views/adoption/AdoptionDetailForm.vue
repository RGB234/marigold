<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { SpeciesLabels } from "@/enums/Species";
import { SexLabels } from "@/enums/Sex";
import { NeuteringLabels } from "@/enums/Neutering";
import { CompletedLabels } from "@/enums/Completed";
import { getAdoptionDetail, deleteAdoption } from '@/api/adoption';

import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const detail = ref(null);

// 로그인 상태 확인
const isLoggedIn = computed(() => authStore.isLoggedIn);
const currentUserId = computed(() => authStore.userId);

// 작성자 본인인지 확인
const isAuthor = computed(() => {
    if (!detail.value || !currentUserId.value) return false;
    return detail.value.writer?.id === currentUserId.value;
});

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
        const responseData = await getAdoptionDetail(id);
        detail.value = responseData;
        loading.value = false;
    } catch (error) {
        router.push({ name: 'Adoption' });
    }
};

// 게시글 수정
const editPost = () => {
    router.push({ name: 'Adoption_edit', params: { id: route.params.id } });
};

// 게시글 삭제 확인
const confirmDelete = () => {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        deletePost();
    }
};

// 게시글 삭제
const deletePost = async () => {
    try {
        loading.value = true;
        await deleteAdoption(route.params.id);
        alert('게시글이 삭제되었습니다.');
        router.push({ name: 'Adoption_list' });
    } catch (error) {
        console.error("게시글 삭제 중 오류 발생:", error);
        alert("게시글 삭제 중 오류가 발생했습니다.");
        loading.value = false;
    }
};

onMounted(async () => {
    const id = route.params.id;
    await fetchDetail(id);
});
</script>

<template>
    <LoadingOverlay v-if="loading"></LoadingOverlay>
    <div class="detail-container">
        <div v-if="loading" class="loading">
            데이터를 불러오는 중입니다...
        </div>

        <div v-else-if="detail" class="content-wrapper">

            <div class="header-section">
                <div class="header-top">
                    <div class="title-row">
                        <span class="badge species">{{ SpeciesLabels[detail.species] }}</span>
                        <span class="badge" :class="{ completed: detail.completed }">{{ CompletedLabels[detail.completed] }}</span>
                        <h1 class="name">{{ detail.name }}</h1>
                    </div>
                    <!-- 작성자 본인만 수정/삭제 버튼 표시 (상단 우측) -->
                    <div v-if="isLoggedIn && isAuthor && detail.completed === false" class="action-buttons">
                        <button class="btn-small edit" @click="editPost">수정</button>
                        <button class="btn-small delete" @click="confirmDelete">삭제</button>
                    </div>
                </div>
                <div class="meta-info">
                    <span>작성자: {{ detail.writer?.nickname || '알 수 없음' }}</span>
                    <span class="divider">|</span>
                    <span>등록일: {{ formatDate(detail.createdAt) }}</span>
                    <span class="divider">|</span>
                    <span>수정일: {{ formatDate(detail.modifiedAt) }}</span>
                </div>
            </div>

            <hr class="separator" />

            <div class="info-grid">
                <div class="info-item">
                    <span class="label">제목</span>
                    <span class="value">{{ detail.title }}</span>
                </div>
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
                    <span class="value">{{ SexLabels[detail.sex] }}</span>
                </div>
                <div class="info-item">
                    <span class="label">몸무게</span>
                    <span class="value">{{ detail.weight }} kg</span>
                </div>
                <div class="info-item">
                    <span class="label">중성화</span>
                    <span class="value">{{ NeuteringLabels[detail.neutering] }}</span>
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
/* 컨테이너 */
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

/* 헤더 */
.header-section {
    margin-bottom: 20px;
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 10px;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.badge {
    background-color: #ff9800;
    color: #fff;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
}

.badge.completed {
    background-color: #888;
    color: #fff;
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

/* 상단 액션 버튼 */
.action-buttons {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

.btn-small {
    padding: 6px 16px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-size: 13px;
    transition: background 0.2s;
}

.btn-small.edit {
    background-color: #2196f3;
    color: white;
}

.btn-small.edit:hover {
    background-color: #1976d2;
}

.btn-small.delete {
    background-color: #f44336;
    color: white;
}

.btn-small.delete:hover {
    background-color: #d32f2f;
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

/* 이미지 */
.image-container {
    grid-column: span 2;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    padding: 16px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-container>div {
    flex: 0 0 auto;
    max-width: 200px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.image-container>div:hover {
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
}

/* 하단 버튼 그룹 */
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

/* 반응형 */
@media (max-width: 600px) {
    .header-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .action-buttons {
        width: 100%;
        justify-content: flex-end;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .info-item.full-width {
        grid-column: span 1;
    }

    .image-container {
        grid-column: span 1;
    }

    .image-container>div {
        max-width: 100%;
    }

    .image-container img {
        height: 250px;
    }
}
</style>