<template>
  <div class="main-container">
    <!-- 로고 -->
    <div class="logo">
      <img src="@/assets/images/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>

    <!-- 로컬 회원가입 폼 -->
    <form @submit.prevent="handleLocalSignup" class="local-auth-form">
      <div class="form-title">이메일로 회원가입</div>
      
      <!-- 일반 에러 메시지 표시 영역 -->
      <div v-if="generalError" class="general-error-msg">
        {{ generalError }}
      </div>
      
      <div class="input-group">
        <input type="email" v-model="signupDto.email" placeholder="이메일" required :class="{ 'is-invalid': getFieldError('email') }" />
<!--        <input type="email" v-model="signupDto.email" placeholder="이메일" :class="{ 'is-invalid': getFieldError('email') }" />-->
        <span class="error-msg" v-if="getFieldError('email')">{{ getFieldError('email') }}</span>
      </div>

      <div class="input-group">
        <input type="password" v-model="signupDto.password" placeholder="비밀번호" required :class="{ 'is-invalid': getFieldError('password') }" />
<!--        <input type="password" v-model="signupDto.password" placeholder="비밀번호" :class="{ 'is-invalid': getFieldError('password') }" />-->
        <span class="error-msg" v-if="getFieldError('password')">{{ getFieldError('password') }}</span>
      </div>

      <div class="input-group">
        <input type="text" v-model="signupDto.nickname" placeholder="닉네임" required :class="{ 'is-invalid': getFieldError('nickname') }" />
<!--        <input type="text" v-model="signupDto.nickname" placeholder="닉네임" :class="{ 'is-invalid': getFieldError('nickname') }" />-->
        <span class="error-msg" v-if="getFieldError('nickname')">{{ getFieldError('nickname') }}</span>
      </div>

      <button type="submit" class="btn-local-auth">회원가입 완료</button>
    </form>

    <!-- 뒤로가기 -->
    <p class="back-btn" @click="goBack">뒤로가기</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/auth/stores/auth';
import router from '@/global/router';
import { useAlert } from '@/global/composables/useAlert';
import { RouteHelper, RouteNames } from '@/global/router/routeHelper';

interface FieldError {
  field: string;
  message: string;
}

const authStore = useAuthStore();
const { toast } = useAlert();

const signupDto = ref({ email: '', password: '', nickname: '' });
const fieldErrors = ref<FieldError[]>([]);
const generalError = ref<string>('');

const getFieldError = (field: string) => {
  const error = fieldErrors.value.find(e => e.field === field);
  return error ? error.message : '';
};

const handleLocalSignup = async () => {
  // 에러 초기화
  fieldErrors.value = [];
  generalError.value = '';

  try {
    await authStore.localSignup(signupDto.value);
    toast.info("회원가입 성공. 로그인 해주세요.");
    router.push(RouteHelper.auth.login());
  } catch (error: any) {
    const errorResponse = error.response?.data;

    fieldErrors.value = errorResponse?.errors || [];

    console.log("errorResponse : ", errorResponse);
  }
};

function goBack() {
  router.push(RouteHelper.auth.signup());
}
</script>

<style scoped>
/* 전체 화면 중앙 정렬 */
div.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  background-color: white;
}

/* 로고 영역 */
div.main-container>div.logo {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

div.logo>img {
  width: 8rem;
  height: 8rem;
  margin-bottom: 0.5rem;
}

div.logo>h1 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #b45309;
}

/* 로컬 인증 폼 스타일 */
.local-auth-form {
  display: flex;
  flex-direction: column;
  width: 16rem;
  margin-bottom: 1.5rem;
}

.form-title {
  font-size: 1.125rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  color: #4b5563;
}

/* 인풋 그룹 및 에러 메시지 */
.input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.local-auth-form input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.local-auth-form input:focus {
  outline: none;
  border-color: #b45309;
}

.local-auth-form input.is-invalid {
  border-color: #ef4444;
}

.error-msg {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  margin-left: 0.25rem;
}

.general-error-msg {
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.btn-local-auth {
  background-color: #b45309;
  color: white;
  padding: 0.75rem 0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-local-auth:hover {
  background-color: #92400e;
}

/* 뒤로가기 텍스트 */
p.back-btn {
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
}

p.back-btn:hover {
  text-decoration: underline;
}
</style>
