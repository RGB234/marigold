<template>
    <div class="profile-form-container">
        <h2>프로필 설정</h2>

        <form @submit.prevent="submitForm">
            <div class="image-upload-section">
                <div class="image-preview" @click="triggerFileInput" :class="{ 'has-image': previewUrl }">
                    <img v-if="previewUrl" :src="previewUrl" alt="Profile Preview" />
                    <div v-else class="placeholder">
                        <span>📷</span>
                        <p>이미지 업로드</p>
                    </div>
                </div>

                <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display: none" />

                <button v-if="previewUrl" type="button" class="remove-btn" @click.stop="resetImageToDefault">
                    기본 이미지
                </button>
            </div>

            <div class="input-group">
                <label for="nickname">닉네임</label>
                <input id="nickname" v-model="nickname" type="text" placeholder="사용할 닉네임을 입력하세요" required />
            </div>

            <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? '저장 중...' : '저장하기' }}
            </button>
        </form>
    </div>
</template>

<script setup>
import api from '@/api/api';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { updateUserProfile, getUserProfile } from '@/api/user'; // 조회 API 추가 가정
import { useAuthStore } from '@/stores/auth';
import defaultProfileImageURL from '@/assets/images/default-profile.png';
import { useRouter } from 'vue-router';

// 상태 관리
const nickname = ref('');
const selectedFile = ref(null); // 새로 선택된 파일 객체
const previewUrl = ref(null);   // 화면에 보여줄 이미지 URL (Blob 또는 서버 URL)

const fileInput = ref(null);
const isSubmitting = ref(false);

const authStore = useAuthStore();
const userId = computed(() => authStore.userId);

const formData = new FormData();
// 1. 초기 데이터 로딩
onMounted(async () => {
    try {
        // 유저 정보 조회 API 호출 (가정)
        const data = await getUserProfile(userId.value); 
        nickname.value = data.nickname;
        
        if (data.imageUrl) {
            previewUrl.value = data.imageUrl; // 초기 이미지는 서버 URL
        }
    } catch (error) {
        console.error('사용자 정보를 불러오는데 실패했습니다.', error);
    }
});

// 2. 메모리 누수 방지: 컴포넌트 해제 시 Blob URL 해제
onUnmounted(() => {
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
    }
});

const triggerFileInput = () => {
    fileInput.value.click();
};

const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        // 기존에 생성된 blob URL이 있다면 메모리 해제
        if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl.value);
        }

        selectedFile.value = file;
        previewUrl.value = URL.createObjectURL(file); // 새 이미지 미리보기

        formData.append('removeImage', false);
    }
};

// 이미지 기본값으로 복구
const resetImageToDefault = () => {
    // 방금 만든 blob URL 해제
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
    }

    selectedFile.value = null;
    fileInput.value = null; 
    
    previewUrl.value = defaultProfileImageURL;

    formData.append('removeImage', true);
};

const submitForm = async () => {
    if (!nickname.value.trim()) return alert('닉네임을 입력해주세요.');

    isSubmitting.value = true;

    try {
        // const formData = new FormData();
        formData.append('nickname', nickname.value);

        // 이미지가 "새로 선택되었을 때만" 보냄
        if (selectedFile.value) {
            formData.append('image', selectedFile.value);
        }

        await updateUserProfile(formData);
        alert('프로필이 저장되었습니다!');
        
        // location.reload();
        router.push({name: 'Profile'});
        
    } catch (error) {
        console.error('Upload failed:', error);
        alert('저장에 실패했습니다.');
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
.profile-form-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.image-upload-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.image-preview {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 2px dashed #ccc;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f9f9f9;
    transition: all 0.3s;
}

.image-preview:hover {
    border-color: #42b983;
    background-color: #e6f7ef;
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.placeholder {
    text-align: center;
    color: #888;
    font-size: 12px;
}

.remove-btn {
    margin-top: 10px;
    background: none;
    border: none;
    color: #ff4d4d;
    cursor: pointer;
    font-size: 13px;
    text-decoration: underline;
}

.input-group {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
}

.input-group label {
    margin-bottom: 5px;
    font-weight: bold;
}

.input-group input {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.submit-btn {
    width: 100%;
    padding: 12px;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

.submit-btn:disabled {
    background-color: #a0dcc0;
    cursor: not-allowed;
}
</style>