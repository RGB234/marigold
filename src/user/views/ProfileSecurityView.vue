<template>
  <div class="security-page">
    <section class="security-shell">
      <div class="hero">
        <div>
          <p class="eyebrow">Account Security</p>
          <h1>로그인 수단을 관리하세요.</h1>
          <p class="hero-copy">
            현재 계정에 이메일 로그인과 소셜 로그인을 함께 연결할 수 있습니다.
          </p>
        </div>
      </div>

      <div v-if="isLoading" class="state-box">보안 설정 정보를 불러오는 중입니다.</div>
      <div v-else-if="!securityInfo" class="state-box">
        보안 설정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
      <div v-else class="security-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-label">Email Login</p>
              <h2>이메일 / 비밀번호 로그인</h2>
            </div>
            <span
              class="status-badge"
              :class="securityInfo.hasLocalCredentials ? 'is-linked' : 'is-pending'"
            >
              {{ securityInfo.hasLocalCredentials ? "연결됨" : "미등록" }}
            </span>
          </div>

          <div v-if="securityInfo.hasLocalCredentials" class="linked-box">
            <strong>{{ securityInfo.email }}</strong>
            <p>이 이메일로 비밀번호 로그인이 가능합니다.</p>
          </div>

          <form v-else class="credential-form" @submit.prevent="submitEmailPassword">
            <label class="field">
              <span>이메일</span>
              <input
                v-model.trim="credentialForm.email"
                type="email"
                placeholder="example@marigold.com"
                autocomplete="email"
                required
              />
            </label>

            <label class="field">
              <span>비밀번호</span>
              <input
                v-model="credentialForm.password"
                type="password"
                placeholder="8자 이상 비밀번호"
                autocomplete="new-password"
                required
              />
            </label>

            <label class="field">
              <span>비밀번호 확인</span>
              <input
                v-model="credentialForm.confirmPassword"
                type="password"
                placeholder="비밀번호를 한 번 더 입력해 주세요"
                autocomplete="new-password"
                required
              />
            </label>

            <p v-if="credentialError" class="error-text">{{ credentialError }}</p>

            <button class="primary-button" type="submit" :disabled="isSubmittingCredentials">
              {{ isSubmittingCredentials ? "등록 중..." : "이메일 로그인 등록" }}
            </button>
          </form>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <p class="panel-label">Social Login</p>
              <h2>소셜 로그인</h2>
            </div>
            <span
              class="status-badge"
              :class="securityInfo.hasOAuth2Link ? 'is-linked' : 'is-pending'"
            >
              {{ securityInfo.hasOAuth2Link ? "연결됨" : "미연결" }}
            </span>
          </div>

          <div v-if="securityInfo.hasOAuth2Link && securityInfo.providerInfo" class="linked-box">
            <strong>{{ getProviderLabel(securityInfo.providerInfo) }}</strong>
            <p>현재 계정에 연결된 소셜 로그인입니다.</p>
          </div>

          <div v-else class="oauth-actions">
            <p class="helper-text">
              현재 백엔드 구조에서는 한 계정에 하나의 소셜 로그인만 연결할 수 있습니다.
            </p>

            <button
              class="oauth-button is-naver"
              type="button"
              @click="startOAuthLink(ProviderInfo.NAVER)"
            >
              네이버 연결하기
            </button>
            <button
              class="oauth-button is-kakao"
              type="button"
              @click="startOAuthLink(ProviderInfo.KAKAO)"
            >
              카카오 연결하기
            </button>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ProviderInfo, useAuthStore } from "@/auth/stores/auth";
import { useAlert } from "@/global/composables/useAlert";
import { RouteHelper } from "@/global/router/routeHelper";
import {
  getUserSecurityInfo,
  registerEmailPassword,
} from "@/user/api/user.api";
import type { LinkedOAuthProvider, UserSecurityInfoDto } from "@/user/types/user";
import { hasSecurityAccess } from "@/user/utils/securityAccess";

const router = useRouter();
const authStore = useAuthStore();
const { alert, toast } = useAlert();

const isLoading = ref(true);
const isSubmittingCredentials = ref(false);
const securityInfo = ref<UserSecurityInfoDto | null>(null);
const credentialError = ref("");

const credentialForm = reactive({
  email: "",
  password: "",
  confirmPassword: "",
});

onMounted(async () => {
  if (!authStore.userId || !hasSecurityAccess(authStore.userId)) {
    await router.replace(RouteHelper.user.securityVerify());
    return;
  }

  await fetchSecurityInfo();
});

async function fetchSecurityInfo() {
  isLoading.value = true;

  try {
    securityInfo.value = await getUserSecurityInfo();
  } catch (error) {
    console.error("Failed to fetch security info:", error);
    securityInfo.value = null;
  } finally {
    isLoading.value = false;
  }
}

async function submitEmailPassword() {
  credentialError.value = validateCredentialForm();
  if (credentialError.value) {
    return;
  }

  isSubmittingCredentials.value = true;

  try {
    await registerEmailPassword({
      email: credentialForm.email,
      password: credentialForm.password,
    });

    toast.success("이메일 로그인 정보가 등록되었습니다.");
    resetCredentialForm();
    await fetchSecurityInfo();
  } catch (error) {
    console.error("Failed to register local credentials:", error);
    credentialError.value = getErrorMessage(
      error,
      "이메일 로그인 정보 등록에 실패했습니다.",
    );
  } finally {
    isSubmittingCredentials.value = false;
  }
}

function startOAuthLink(provider: ProviderInfo) {
  if (!authStore.userId) {
    return;
  }

  authStore.login(provider, {
    action: "link",
    redirectTo: router.resolve(RouteHelper.user.security()).href,
    expectedUserId: authStore.userId,
    grantSecurityAccess: true,
  });
}

function validateCredentialForm() {
  if (!credentialForm.email) {
    return "이메일을 입력해 주세요.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentialForm.email)) {
    return "올바른 이메일 형식을 입력해 주세요.";
  }

  if (credentialForm.password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }

  if (credentialForm.password !== credentialForm.confirmPassword) {
    return "비밀번호 확인이 일치하지 않습니다.";
  }

  return "";
}

function resetCredentialForm() {
  credentialForm.email = "";
  credentialForm.password = "";
  credentialForm.confirmPassword = "";
  credentialError.value = "";
}

function getProviderLabel(provider: LinkedOAuthProvider) {
  return provider === "KAKAO" ? "카카오" : "네이버";
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  return fallbackMessage;
}
</script>

<style scoped>
.security-page {
  max-width: 1040px;
  margin: 24px auto;
  padding: 24px;
}

.security-shell {
  background:
    radial-gradient(circle at top right, rgba(252, 235, 186, 0.65), transparent 32%),
    linear-gradient(180deg, #fffef8 0%, #ffffff 100%);
  border: 1px solid #ead9b2;
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 18px 46px rgba(107, 79, 28, 0.1);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #9d6b11;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 0;
  color: #2f2512;
  font-size: 30px;
}

.hero-copy {
  margin: 12px 0 0;
  color: #6a5733;
  line-height: 1.6;
}

.security-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.panel,
.state-box {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #ece1cb;
  border-radius: 20px;
  padding: 22px;
}

.state-box {
  color: #67563a;
  line-height: 1.6;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.panel-label {
  margin: 0 0 6px;
  color: #9f7f4a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.panel-header h2 {
  margin: 0;
  color: #2f2511;
  font-size: 22px;
}

.status-badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.is-linked {
  background: rgba(15, 128, 84, 0.12);
  color: #0f6b48;
}

.status-badge.is-pending {
  background: rgba(185, 125, 17, 0.12);
  color: #8e6310;
}

.linked-box {
  border: 1px solid #efe3ca;
  border-radius: 16px;
  padding: 18px;
  background: #fffdfa;
}

.linked-box strong {
  display: block;
  color: #2d2411;
  font-size: 18px;
}

.linked-box p,
.helper-text {
  margin: 10px 0 0;
  color: #685739;
  line-height: 1.6;
}

.credential-form,
.oauth-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field span {
  color: #5a492d;
  font-size: 14px;
  font-weight: 600;
}

.field input {
  border: 1px solid #dac9a8;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 15px;
  background: #fffdf8;
}

.field input:focus {
  outline: none;
  border-color: #bb8212;
  box-shadow: 0 0 0 4px rgba(187, 130, 18, 0.12);
}

.error-text {
  margin: 0;
  color: #cb3d34;
  font-size: 14px;
}

.primary-button,
.outline-button,
.oauth-button {
  border: none;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease;
}

.primary-button,
.oauth-button {
  padding: 14px 18px;
}

.primary-button {
  background: #b67d12;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(135, 97, 22, 0.14);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.oauth-button {
  box-shadow: 0 12px 26px rgba(73, 73, 73, 0.08);
}

.oauth-button.is-naver {
  background: #03c75a;
  color: #ffffff;
}

.oauth-button.is-kakao {
  background: #fee500;
  color: #231f20;
}

.primary-button:not(:disabled):hover,
.outline-button:hover,
.oauth-button:hover {
  transform: translateY(-1px);
}

@media (max-width: 860px) {
  .security-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .security-page {
    padding: 16px;
  }

  .security-shell {
    padding: 20px;
    border-radius: 22px;
  }

  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero h1 {
    font-size: 26px;
  }
}
</style>
