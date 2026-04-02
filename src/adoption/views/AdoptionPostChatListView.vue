<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdoptionCandidates, getAdoptionPostDetail } from '@/adoption/api/adoptionPost.api';
import { getOrCreateChatRoom } from '@/chat/api/chat.api';
import { RouteHelper } from '@/global/router/routeHelper';
import { AdoptionCandidateResponse, AdoptionPostDetailResponse } from '@/adoption/types/adoptionPost';
import { useAlert } from '@/global/composables/useAlert';
import { AdoptionPostStatus, getAdoptionStatusLabel } from '@/adoption/enums/AdoptionPostStatus';
import NoImage from '@/assets/images/no-image.jpeg';

const route = useRoute();
const router = useRouter();
const { toast } = useAlert();

const adoptionPostId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

const candidates = ref<AdoptionCandidateResponse[]>([]);
const postDetail = ref<AdoptionPostDetailResponse | null>(null);
const loading = ref(false);

const fetchData = async () => {
    if (!adoptionPostId) return;

    loading.value = true;
    try {
        // 병렬로 게시글 정보와 후보자(채팅 내역이 있는 사용자) 목록 조회
        const [detailData, candidatesData] = await Promise.all([
            getAdoptionPostDetail(adoptionPostId),
            getAdoptionCandidates(adoptionPostId)
        ]);
        
        postDetail.value = detailData;
        candidates.value = candidatesData;
    } catch (error) {
        console.error("데이터 조회 중 오류 발생:", error);
        toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
        loading.value = false;
    }
};

const goToChatRoom = async (candidateId: string) => {
    try {
        // 기존 채팅방 조회 (또는 생성)
        const chatRoom = await getOrCreateChatRoom(adoptionPostId, candidateId);
        router.push(RouteHelper.chat.room(chatRoom.id.toString()));
    } catch (error) {
        console.error("채팅방 이동 중 오류 발생:", error);
        toast.error("채팅방 이동 중 오류가 발생했습니다.");
    }
};

// const goToPostDetail = () => {
//     router.push(RouteHelper.adoption.detail(adoptionPostId));
// };

const goBack = () => {
    router.back();
};

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div class="chat-list-container">
        <div class="page-header">
            <div class="back-btn" @click="goBack">
                < 뒤로가기
            </div>
            <h2>채팅 목록</h2>
        </div>

        <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>목록을 불러오는 중입니다...</p>
        </div>

        <div v-else class="content-wrapper">
            <!-- 요약 게시글 정보 영역 -->
            <!-- <div v-if="postDetail" class="post-summary" @click="goToPostDetail"> -->
            <div v-if="postDetail" class="post-summary">
                <div class="summary-img">
                    <img :src="postDetail.imageUrls?.[0] || NoImage" alt="썸네일" />
                </div>
                <div class="summary-info">
                    <div class="summary-status-row">
                        <span class="status-badge" :class="{ done: postDetail.status === AdoptionPostStatus.COMPLETED }">
                            {{ getAdoptionStatusLabel(postDetail.status) }}
                        </span>
                    </div>
                    <div class="summary-title">{{ postDetail.title }}</div>
                </div>
            </div>

            <hr class="separator" />

            <h3>대화 중인 사용자 ({{ candidates.length }})</h3>

            <!-- 채팅 목록 영역 -->
            <div v-if="candidates.length > 0" class="candidates-list">
                <div 
                    v-for="candidate in candidates" 
                    :key="candidate.id" 
                    class="candidate-item"
                    @click="goToChatRoom(candidate.id)"
                >
                    <div class="candidate-profile">
                        <img :src="candidate.imageUrl || NoImage" alt="프로필" class="candidate-img" />
                        <span class="candidate-nickname">{{ candidate.nickname }}</span>
                    </div>
                    <div class="action-arrow">
                        채팅방 이동 〉
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <div class="empty-icon">💬</div>
                <p>아직 이 글에 연결된 채팅이 없습니다.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.chat-list-container {
    max-width: 600px;
    min-width: 500px;
    width: 100%;
    margin: 0 auto;
    padding: 40px 20px;
    box-sizing: border-box;
}

.page-header {
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    position: relative;
}

.back-btn {
    position: absolute;
    left: 0;
    cursor: pointer;
    color: #666;
    font-weight: 500;
}

.page-header h2 {
    font-size: 24px;
    color: #333;
    margin: 0 auto;
}

.content-wrapper {
    background-color: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    width: 100%;
    box-sizing: border-box;
}

/* 게시글 요약 카드 */
.post-summary {
    display: flex;
    gap: 16px;
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    /* cursor: pointer;
    transition: background-color 0.2s; */
}

/* .post-summary:hover {
    background-color: #f1f3f5;
} */

.summary-img {
    width: 100px;
    height: 100px;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
}

.summary-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.summary-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
}

.summary-info > :nth-child(3) {
    align-self: flex-end;
}

.status-badge {
    display: inline-block;
    background-color: #ff9800;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 6px;
}

.status-badge.done {
    background-color: #888;
}

.summary-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.summary-desc {
    font-size: 14px;
    color: #666;
}

.separator {
    border: none;
    border-top: 1px solid #eee;
    margin: 24px 0;
}

h3 {
    font-size: 18px;
    margin-bottom: 16px;
    color: #333;
}

/* 후보자 목록 */
.candidates-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.candidate-item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border: 1px solid #eee;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.candidate-item > :nth-child(2) {
    align-self: flex-end;
}

.candidate-item:hover {
    border-color: #ddd;
    background-color: #fafafa;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.candidate-profile {
    display: flex;
    align-items: center;
    gap: 16px;
}

.candidate-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #eee;
}

.candidate-nickname {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

.action-arrow {
    color: #aaa;
    font-size: 13px;
    font-weight: 500;
}

.candidate-item:hover .action-arrow {
    color: #ff9800;
}

/* 로딩 & 빈 상태 */
.loading-state, .empty-state {
    text-align: center;
    padding: 60px 0;
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}
</style>
