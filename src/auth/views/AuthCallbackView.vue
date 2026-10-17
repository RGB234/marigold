<template>
  <div class="callback-container">
    <RequestErrorState v-if="restoreError" :message="restoreError" @retry="handleOAuthCallback" />
    <RequestLoadingState v-else message="로그인을 처리하고 있습니다..." />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDialog } from "@/shared/feedback/dialog/useDialog";
import { useAuthStore } from "@/auth/stores/auth";
import { RouteHelper } from "@/shared/navigation/routeHelper";
import RequestErrorState from "@/shared/ui/request-state/RequestErrorState.vue";
import RequestLoadingState from "@/shared/ui/request-state/RequestLoadingState.vue";
import { getErrorMessage } from "@/shared/errors/errorMessages";
import { getApiErrorMessage, normalizeApiError } from "@/shared/errors/apiError";
import {
  clearPendingAuthState,
  getPendingAuthState,
} from "@/auth/utils/pendingAuth";
import {
  clearSecurityAccess,
  grantSecurityAccess,
} from "@/auth/utils/securityAccess";

const route = useRoute();
const router = useRouter();
const { alert } = useDialog();
const authStore = useAuthStore();
const restoreError = ref("");

onMounted(async () => {
  await handleOAuthCallback();
});

async function handleOAuthCallback() {
  restoreError.value = "";
  const errorParam = route.query.error;
  const authStatusParam = route.query.auth_status;

  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const authStatus = Array.isArray(authStatusParam)
    ? authStatusParam[0]
    : authStatusParam;

  const pendingAuthState = getPendingAuthState();
  const redirectTo =
    pendingAuthState?.redirectTo ?? router.resolve(RouteHelper.home()).fullPath;

  if (errorCode) {
    clearPendingAuthState();
    clearSecurityAccess();
    await alert(
      "OAuth2 인증 실패",
      getErrorMessage({ errorCode }, "인증을 완료하지 못했습니다. 다시 시도해주세요."),
    );
    await router.replace(RouteHelper.auth.login());
    return;
  }

  const shouldRestoreAuth =
    authStatus === "LOGIN_SUCCESS" ||
    authStatus === "SIGNUP_SUCCESS" ||
    authStatus === "LINK_SUCCESS";
  if (shouldRestoreAuth) {
    try {
      await authStore.restoreSession();
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.type !== "api" || normalized.status !== 401) {
        restoreError.value = getApiErrorMessage(error);
        return;
      }
      clearPendingAuthState();
      clearSecurityAccess();
      await alert("로그인 필요", "인증 정보를 복구하지 못했습니다. 다시 로그인해 주세요.");
      await router.replace(RouteHelper.auth.login());
      return;
    }

    if (!authStore.isAuthenticated) {
      clearPendingAuthState();
      clearSecurityAccess();
      await alert("로그인 필요", "인증 정보를 확인하지 못했습니다. 다시 로그인해 주세요.");
      await router.replace(RouteHelper.auth.login());
      return;
    }
  }

  if (
    pendingAuthState?.expectedUserId &&
    authStore.userId &&
    pendingAuthState.expectedUserId !== authStore.userId
  ) {
    clearPendingAuthState();
    clearSecurityAccess();
    await alert(
      "계정 확인 필요",
      "다른 계정으로 로그인되어 보안 페이지로 이동할 수 없습니다.",
    );
    await router.replace(RouteHelper.home());
    return;
  }

  if (authStore.userId) {
    if (pendingAuthState?.grantSecurityAccess) {
      grantSecurityAccess(authStore.userId);
    }
  }

  clearPendingAuthState();

  switch (authStatus) {
    case "BANNED":
      clearSecurityAccess();
      await alert("정지된 계정", "관리자에 의해 정지된 계정입니다.");
      await router.replace(RouteHelper.auth.login());
      break;
    case "SLEEP":
      clearSecurityAccess();
      await alert("휴면 계정", "휴면 상태인 계정입니다. 해제가 필요합니다.");
      await router.replace(RouteHelper.home());
      break;
    case "DELETED":
      clearSecurityAccess();
      await alert("탈퇴한 계정", "탈퇴 처리된 계정입니다. 재가입이 필요합니다.");
      await router.replace(RouteHelper.auth.login());
      break;
    case "SIGNUP_SUCCESS":
    case "LOGIN_SUCCESS":
    case "LINK_SUCCESS":
    default:
      await router.replace(redirectTo);
      break;
  }
}
</script>

<style scoped>
.callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
</style>
