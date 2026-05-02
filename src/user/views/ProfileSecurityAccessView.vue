<template>
  <div class="security-access-page">
    <section class="security-card">
      <div class="card-header">
        <p class="eyebrow">Security</p>
        <h1>보안 페이지에 들어가기 전에 다시 로그인해 주세요.</h1>
        <p class="description">
          민감한 계정 설정을 변경하기 전에 본인 확인이 필요합니다.
        </p>
      </div>

      <div v-if="isLoading" class="state-box">보안 설정 정보를 불러오는 중입니다.</div>
      <div v-else-if="!securityInfo" class="state-box">
        보안 설정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.
      </div>
      <div v-else class="verify-sections">
        <form
          v-if="securityInfo.hasLocalCredentials && securityInfo.email"
          class="verify-section"
          @submit.prevent="reauthenticateWithPassword"
        >
          <div class="section-copy">
            <h2>이메일로 재로그인</h2>
            <p>{{ securityInfo.email }} 계정으로 다시 로그인합니다.</p>
          </div>

          <label class="field">
            <span>이메일</span>
            <input :value="securityInfo.email" type="email" readonly />
          </label>

          <label class="field">
            <span>비밀번호</span>
            <input
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력해 주세요"
              autocomplete="current-password"
              required
            />
          </label>

          <button class="primary-button" type="submit" :disabled="isSubmittingPassword">
            {{ isSubmittingPassword ? "확인 중..." : "이메일로 재로그인" }}
          </button>
        </form>

        <section
          v-if="securityInfo.hasOAuth2Link && securityInfo.providerInfo"
          class="verify-section"
        >
          <div class="section-copy">
            <h2>소셜 로그인으로 재확인</h2>
            <p>{{ providerLabel }} 계정으로 다시 인증할 수 있습니다.</p>
          </div>

          <button
            class="oauth-button"
            :class="providerButtonClass"
            type="button"
            @click="reauthenticateWithOAuth"
          >
            {{ providerLabel }}로 재로그인
          </button>
        </section>

        <div
          v-if="!securityInfo.hasLocalCredentials && !securityInfo.hasOAuth2Link"
          class="state-box"
        >
          사용할 수 있는 로그인 수단이 없습니다. 다시 로그인한 뒤 시도해 주세요.
        </div>
      </div>

      <div class="footer-actions">
        <button class="ghost-button" type="button" @click="goBackToProfile">
          프로필로 돌아가기
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ProviderInfo, useAuthStore } from "@/auth/stores/auth";
import { useAlert } from "@/global/composables/useAlert";
import { RouteHelper } from "@/global/router/routeHelper";
import { getUserSecurityInfo } from "@/user/api/user.api";
import type { UserSecurityInfoDto } from "@/user/types/user";
import {
  clearSecurityAccess,
  grantSecurityAccess,
} from "@/user/utils/securityAccess";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { alert, toast } = useAlert();

const isLoading = ref(true);
const isSubmittingPassword = ref(false);
const securityInfo = ref<UserSecurityInfoDto | null>(null);
const password = ref("");

const providerLabel = computed(() => {
  switch (securityInfo.value?.providerInfo) {
    case "KAKAO":
      return "카카오";
    case "NAVER":
      return "네이버";
    default:
      return "소셜";
  }
});

const providerButtonClass = computed(() => {
  switch (securityInfo.value?.providerInfo) {
    case "KAKAO":
      return "is-kakao";
    case "NAVER":
      return "is-naver";
    default:
      return "";
  }
});

onMounted(async () => {
  clearSecurityAccess();
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

async function reauthenticateWithPassword() {
  if (!securityInfo.value?.email) {
    return;
  }

  const expectedUserId = authStore.userId;
  if (!expectedUserId) {
    await router.replace(RouteHelper.auth.login());
    return;
  }

  isSubmittingPassword.value = true;

  try {
    await authStore.localLogin({
      email: securityInfo.value.email,
      password: password.value,
    });

    if (!authStore.userId || authStore.userId !== expectedUserId) {
      clearSecurityAccess();
      await alert(
        "계정 확인 필요",
        "같은 계정으로 다시 로그인한 뒤 보안 페이지에 접근해 주세요.",
      );
      await router.replace(RouteHelper.home());
      return;
    }

    grantSecurityAccess(authStore.userId);
    toast.success("재로그인이 확인되었습니다.");
    await router.replace(getSecurityRouteAfterVerify());
  } catch (error) {
    console.error("Password reauthentication failed:", error);
    await alert("재로그인 실패", getErrorMessage(error, "비밀번호를 다시 확인해 주세요."));
  } finally {
    isSubmittingPassword.value = false;
  }
}

function reauthenticateWithOAuth() {
  if (!securityInfo.value?.providerInfo || !authStore.userId) {
    return;
  }

  authStore.login(securityInfo.value.providerInfo as ProviderInfo, {
    redirectTo: router.resolve(getSecurityRouteAfterVerify()).href,
    expectedUserId: authStore.userId,
    grantSecurityAccess: true,
  });
}

function getSecurityRouteAfterVerify() {
  const intent = route.query.intent;
  const query = intent === "delete" ? { intent } : undefined;

  return {
    ...RouteHelper.user.security(),
    query,
  };
}

async function goBackToProfile() {
  if (authStore.userId) {
    await router.push(RouteHelper.user.profile(authStore.userId));
    return;
  }

  await router.push(RouteHelper.home());
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  return fallbackMessage;
}
</script>

<style scoped>
.security-access-page {
  max-width: 760px;
  margin: 24px auto;
  padding: 24px;
}

.security-card {
  border: 1px solid #ecd8af;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 16px 40px rgba(117, 85, 21, 0.08);
}

.card-header {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #9a6c10;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-header h1 {
  margin: 0;
  color: #2f2410;
  font-size: 28px;
  line-height: 1.3;
}

.description {
  margin: 12px 0 0;
  color: #6f5b33;
  line-height: 1.6;
}

.verify-sections {
  display: grid;
  gap: 16px;
}

.verify-section,
.state-box {
  background: #ffffff;
  border: 1px solid #eadfca;
  border-radius: 18px;
  padding: 20px;
}

.section-copy h2 {
  margin: 0;
  color: #30240e;
  font-size: 20px;
}

.section-copy p,
.state-box {
  margin: 10px 0 0;
  color: #66553a;
  line-height: 1.6;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.field span {
  color: #5d4b2f;
  font-size: 14px;
  font-weight: 600;
}

.field input {
  border: 1px solid #dac8a2;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 15px;
  background: #fffdf8;
}

.field input:focus {
  outline: none;
  border-color: #b87e11;
  box-shadow: 0 0 0 4px rgba(184, 126, 17, 0.12);
}

.primary-button,
.oauth-button,
.ghost-button {
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease;
}

.primary-button,
.oauth-button {
  margin-top: 18px;
  width: 100%;
  padding: 14px 18px;
  box-shadow: 0 12px 24px rgba(135, 97, 22, 0.14);
}

.primary-button {
  background: #b87e11;
  color: #ffffff;
}

.oauth-button {
  color: #1f1f1f;
}

.oauth-button.is-kakao {
  background: #fee500;
}

.oauth-button.is-naver {
  background: #03c75a;
  color: #ffffff;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.primary-button:not(:disabled):hover,
.oauth-button:hover,
.ghost-button:hover {
  transform: translateY(-1px);
}

.footer-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.ghost-button {
  background: transparent;
  border: 1px solid #d2c09d;
  color: #6c5730;
  padding: 12px 18px;
}

@media (max-width: 640px) {
  .security-access-page {
    padding: 16px;
  }

  .security-card {
    padding: 20px;
    border-radius: 20px;
  }

  .card-header h1 {
    font-size: 24px;
  }

  .footer-actions {
    justify-content: stretch;
  }

  .ghost-button {
    width: 100%;
  }
}
</style>
