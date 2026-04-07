<template>
    <div class="profile-form-container">
        <h2>프로필 수정</h2>

        <form @submit.prevent="submitForm">
            <div class="image-upload-section">
                <div class="image-preview" @click="triggerFileInput">
                    <img :src="previewUrl" alt="프로필 이미지" class="profile-img" />
                </div>

                <input type="file" ref="fileInput" @change="handleFileChange" accept="image/jpeg, image/png, image/webp" style="display: none" />

                <button v-if="previewUrl" type="button" class="remove-btn" @click.stop="resetImageToDefault">
                    기본 이미지
                </button>
            </div>

            <div v-if="errors.nickname" class="error-message">{{ errors.nickname }}</div>
            <div class="input-group">
                <label for="nickname">닉네임</label>
                <input id="nickname" v-model="form.nickname" type="text" placeholder="사용할 닉네임을 입력하세요" required />
            </div>

            <div v-if="errors.image" class="error-message">{{ errors.image }}</div>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? '저장 중...' : '저장하기' }}
            </button>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue';
import { updateUserProfile, getUserProfile } from '@/user/api/user.api'; // 조회 API 추가 가정
import { convertToFormData } from '@/global/utils/objectUtils';
import { useAuthStore } from '@/auth/stores/auth';
import defaultProfileImage from '@/assets/images/default-profile.png';
import { useRouter } from 'vue-router';
import { isApiResponse } from '@/global/types/common';
import { ErrorDetail } from '@/global/types/common';
import { RouteHelper } from '@/global/router/routeHelper';

interface ProfileForm {
    nickname: string;
    image: File | null;
    removeImage: boolean;
}

// 상태 관리
const form = reactive<ProfileForm>({
    nickname: '',
    image: null,
    removeImage: false,
});

const errors = reactive<Record<keyof ProfileForm, string>>({
    nickname: "",
    image: "",
    removeImage: "",
});

const previewUrl = ref<string | null>(null);   // 화면에 보여줄 이미지 URL (Blob 또는 서버 URL)

const fileInput = ref<HTMLInputElement | null>(null); // 파일입력 DOM 요소에 대한 참조
const isSubmitting = ref(false);

const authStore = useAuthStore();
const userId = computed(() => authStore.userId);
const router = useRouter();

const handleFetchUserProfile = async () => {
    try {
        // 유저 정보 조회 API 호출 (가정)
        if (userId.value) {
            const data = await getUserProfile(userId.value);
            form.nickname = data.nickname;
            
            if (data.imageUrl) {
                // form은 채우지 않으며 previewUrl만 설정
                previewUrl.value = data.imageUrl;
            }
        }
    } catch (error) {
        console.error('사용자 정보를 불러오는데 실패했습니다.', error);
    }
}


onMounted(async () => {
    await handleFetchUserProfile();
});

// 메모리 누수 방지: 컴포넌트 해제 시 Blob URL 해제
onUnmounted(() => {
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
    }
});

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    errors.image = '';

    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            errors.image = 'JPG, JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            errors.image = '파일 크기는 5MB 이하여야 합니다.';
            return;
        }

        // 기존에 생성된 blob URL이 있다면 메모리 해제
        if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl.value);
        }

        form.image = file;
        previewUrl.value = URL.createObjectURL(file); // 새 이미지 미리보기

        form.removeImage = false;
    }
};

// 이미지 기본값으로 복구
const resetImageToDefault = () => {
    // 방금 만든 blob URL 해제
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
    }

    form.image = null;
    if (fileInput.value) fileInput.value.value = ''; // 파일 입력 초기화
    
    previewUrl.value = defaultProfileImage;
    errors.image = '';
    form.removeImage = true;
};

const isValidNickname = (nickname: string) => {
    if (!nickname) return false;
    const pattern = /^[가-힣a-zA-Z0-9]{2,12}$/;
    return pattern.test(nickname);
}

const submitForm = async () => {
    errors.nickname = '';
    errors.image = '';
    errors.removeImage = '';

    if (!isValidNickname(form.nickname)) {
        errors.nickname = '닉네임은 2자 이상 12자 이하의 한글, 영문, 숫자만 사용할 수 있습니다.';
        return;
    }

    try {
        isSubmitting.value = true;
        const formData = convertToFormData(form);

        await updateUserProfile(formData);
        // location.reload();
        if(userId.value) router.push(RouteHelper.user.profile(userId.value));
    } catch (error) {
        if(isApiResponse(error)){
            if(error.errors && Array.isArray(error.errors)){
                error.errors.forEach((error: ErrorDetail) => {
                    errors[error.field as keyof ProfileForm] = error.message;
                });
            }
        }else{
            console.error("프로필 수정 중 오류 발생:", error);
        }
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
.profile-form-container {
    max-width: 600px;
    min-width: max-content;
    width: 100%;
    box-sizing: border-box;
    margin: 20px auto;
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

.error-message {
    color: #ff4d4d;
    font-size: 13px;
    margin-bottom: 10px;
}
</style>