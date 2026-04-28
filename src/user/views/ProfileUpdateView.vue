<template>
    <div class="profile-form-container">
        <h2>프로필 수정</h2>

        <form @submit.prevent="submitForm">
            <div class="image-upload-section">
                <div class="image-preview" @click="triggerFileInput">
                    <img :src="previewUrl" alt="프로필 이미지" class="profile-img" />
                </div>

                <input
                    ref="fileInput"
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    style="display: none"
                    @change="handleFileChange"
                />

                <button
                    v-if="previewUrl"
                    type="button"
                    class="remove-btn"
                    @click.stop="resetImageToDefault"
                >
                    기본 이미지
                </button>
            </div>

            <div v-if="errors.nickname" class="error-message">{{ errors.nickname }}</div>
            <div class="input-group">
                <label for="nickname">닉네임</label>
                <input
                    id="nickname"
                    v-model="form.nickname"
                    type="text"
                    placeholder="사용할 닉네임을 입력하세요."
                    required
                />
            </div>

            <div v-if="errors.image" class="error-message">{{ errors.image }}</div>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? '처리 중...' : '저장하기' }}
            </button>
        </form>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/auth/stores/auth';
import defaultProfileImage from '@/assets/images/default-profile.png';
import { RouteHelper } from '@/global/router/routeHelper';
import type { ErrorDetail } from '@/global/types/common';
import { extractApiErrorResponse } from '@/global/utils/apiError';
import { convertToFormData } from '@/global/utils/objectUtils';
import { getUserProfile, updateUserProfile } from '@/user/api/user.api';

interface ProfileForm {
    nickname: string;
    image: File | null;
    removeImage: boolean;
}

const form = reactive<ProfileForm>({
    nickname: '',
    image: null,
    removeImage: false,
});

const errors = reactive<Record<keyof ProfileForm, string>>({
    nickname: '',
    image: '',
    removeImage: '',
});

const previewUrl = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isSubmitting = ref(false);

const authStore = useAuthStore();
const userId = computed(() => authStore.userId);
const router = useRouter();

const resetErrors = () => {
    errors.nickname = '';
    errors.image = '';
    errors.removeImage = '';
};

const applyFieldErrors = (errorDetails?: ErrorDetail[]) => {
    if (!Array.isArray(errorDetails) || errorDetails.length === 0) {
        return false;
    }

    errorDetails.forEach((error) => {
        errors[error.field as keyof ProfileForm] = error.message;
    });

    return true;
};

const handleFetchUserProfile = async () => {
    try {
        if (!userId.value) {
            return;
        }

        const data = await getUserProfile(userId.value);
        form.nickname = data.nickname;
        previewUrl.value = data.imageUrl || defaultProfileImage;
    } catch (error) {
        console.error('사용자 정보를 불러오는데 실패했습니다.', error);
    }
};

onMounted(async () => {
    await handleFetchUserProfile();
});

onUnmounted(() => {
    if (previewUrl.value?.startsWith('blob:')) {
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

    if (!file) {
        return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        errors.image = 'JPG, JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        errors.image = '파일 크기는 5MB 이하여야 합니다.';
        return;
    }

    if (previewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
    }

    form.image = file;
    form.removeImage = false;
    previewUrl.value = URL.createObjectURL(file);
};

const resetImageToDefault = () => {
    if (previewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
    }

    form.image = null;
    form.removeImage = true;
    errors.image = '';
    previewUrl.value = defaultProfileImage;

    if (fileInput.value) {
        fileInput.value.value = '';
    }
};

const isValidNickname = (nickname: string) => {
    if (!nickname) {
        return false;
    }

    const pattern = /^[가-힣a-zA-Z0-9]{2,12}$/;
    return pattern.test(nickname);
};

const submitForm = async () => {
    resetErrors();

    if (!isValidNickname(form.nickname)) {
        errors.nickname = '닉네임은 2자 이상 12자 이하의 한글, 영문, 숫자만 사용할 수 있습니다.';
        return;
    }

    try {
        isSubmitting.value = true;
        const formData = convertToFormData(form);

        await updateUserProfile(formData);

        if (userId.value) {
            await router.push(RouteHelper.user.profile(userId.value));
        }
    } catch (error: unknown) {
        const apiError = extractApiErrorResponse(error);

        if (!applyFieldErrors(apiError?.errors)) {
            console.error('프로필 수정 중 오류 발생:', error);
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
