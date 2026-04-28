<template>
  <div class="main-container">
    <div class="logo">
      <img src="@/assets/images/logo.png" alt="Marigold" />
      <h1>Marigold</h1>
    </div>

    <form @submit.prevent="handleLocalSignup" class="local-auth-form">
      <div class="form-title">이메일로 회원가입</div>

      <div v-if="generalError" class="general-error-msg">
        {{ generalError }}
      </div>

      <div class="input-group">
        <input
          v-model="signupDto.email"
          type="email"
          placeholder="이메일"
          required
          :class="{ 'is-invalid': getFieldError('email') }"
        />
        <span v-if="getFieldError('email')" class="error-msg">{{ getFieldError('email') }}</span>
      </div>

      <div class="input-group">
        <div class="password-wrapper">
          <input
            v-model="signupDto.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="비밀번호"
            required
            :class="{ 'is-invalid': getFieldError('password') }"
          />
          <span class="toggle-password" @click="showPassword = !showPassword">
            <img
              v-if="!showPassword"
              src="@/assets/images/visibility_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg"
              width="20"
              height="20"
              alt="비밀번호 표시"
            />
            <img
              v-else
              src="@/assets/images/visibility_off_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg"
              width="20"
              height="20"
              alt="비밀번호 숨기기"
            />
          </span>
        </div>
        <span v-if="!getFieldError('password')" class="hint-msg">8자 이상</span>
        <span v-else class="error-msg">{{ getFieldError('password') }}</span>
      </div>

      <div class="input-group">
        <div class="password-wrapper">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="비밀번호 확인"
            required
            :class="{ 'is-invalid': getFieldError('confirmPassword') }"
          />
          <span class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
            <img
              v-if="!showConfirmPassword"
              src="@/assets/images/visibility_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg"
              width="20"
              height="20"
              alt="비밀번호 확인 표시"
            />
            <img
              v-else
              src="@/assets/images/visibility_off_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg"
              width="20"
              height="20"
              alt="비밀번호 확인 숨기기"
            />
          </span>
        </div>
        <span v-if="!getFieldError('confirmPassword')" class="hint-msg">비밀번호를 한 번 더 입력하세요</span>
        <span v-else class="error-msg">{{ getFieldError('confirmPassword') }}</span>
      </div>

      <div class="input-group">
        <input
          v-model="signupDto.nickname"
          type="text"
          placeholder="닉네임"
          required
          :class="{ 'is-invalid': getFieldError('nickname') }"
        />
        <span v-if="!getFieldError('nickname')" class="hint-msg">
          3자 이상, 12자 이하 (영문, 한글, 숫자 사용)
        </span>
        <span v-else class="error-msg">{{ getFieldError('nickname') }}</span>
      </div>

      <button type="submit" class="btn-local-auth">회원가입 완료</button>
    </form>

    <p class="back-btn" @click="goBack">뒤로가기</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/auth/stores/auth";
import { useAlert } from "@/global/composables/useAlert";
import router from "@/global/router";
import { RouteHelper } from "@/global/router/routeHelper";

interface FieldError {
  field: string;
  message: string;
}

const authStore = useAuthStore();
const { toast } = useAlert();

const signupDto = ref({ email: "", password: "", nickname: "" });
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const fieldErrors = ref<FieldError[]>([]);
const generalError = ref("");

const getFieldError = (field: string) => {
  const error = fieldErrors.value.find((item) => item.field === field);
  return error ? error.message : "";
};

const validateSignupForm = () => {
  const errors: FieldError[] = [];

  if (signupDto.value.password.length < 8) {
    errors.push({ field: "password", message: "비밀번호는 8자 이상이어야 합니다." });
  }

  if (!confirmPassword.value) {
    errors.push({ field: "confirmPassword", message: "비밀번호 확인을 입력해 주세요." });
  } else if (signupDto.value.password !== confirmPassword.value) {
    errors.push({ field: "confirmPassword", message: "비밀번호 확인이 일치하지 않습니다." });
  }

  fieldErrors.value = errors;
  return errors.length === 0;
};

const handleLocalSignup = async () => {
  fieldErrors.value = [];
  generalError.value = "";

  if (!validateSignupForm()) {
    return;
  }

  try {
    await authStore.localSignup(signupDto.value);
    toast.info("회원가입 성공. 로그인 해주세요.");
    confirmPassword.value = "";
    await router.push(RouteHelper.auth.login());
  } catch (error: any) {
    const errorResponse = error.response?.data;

    fieldErrors.value = errorResponse?.errors || [];
    generalError.value = errorResponse?.message || "";
    console.log("errorResponse : ", errorResponse);
  }
};

function goBack() {
  router.push(RouteHelper.auth.signup());
}
</script>

<style scoped>
div.main-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  background-color: white;
}

div.main-container > div.logo {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

div.logo > img {
  width: 8rem;
  height: 8rem;
  margin-bottom: 0.5rem;
}

div.logo > h1 {
  font-size: 1.5rem;
  font-weight: bold;
  color: #b45309;
}

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

.password-wrapper {
  position: relative;
  width: 100%;
}

.password-wrapper input {
  padding-right: 2.5rem;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: #374151;
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

.hint-msg {
  color: #6b7280;
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

p.back-btn {
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
}

p.back-btn:hover {
  text-decoration: underline;
}
</style>
