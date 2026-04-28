<template>
  <div class="callback-container">
    <h4>처리 중입니다. 잠시만 기다려 주세요.</h4>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAlert } from "@/global/composables/useAlert";
import { useAuthStore } from "@/auth/stores/auth";
import { RouteHelper } from "@/global/router/routeHelper";
import {
  clearPendingAuthState,
  getPendingAuthState,
} from "@/auth/utils/pendingAuth";
import {
  clearSecurityAccess,
  grantSecurityAccess,
} from "@/user/utils/securityAccess";

const route = useRoute();
const router = useRouter();
const { alert } = useAlert();
const authStore = useAuthStore();

onMounted(async () => {
  await handleOAuthCallback();
});

async function handleOAuthCallback() {
  const errorParam = route.query.error;
  const descriptionParam = route.query.error_description;
  const authStatusParam = route.query.auth_status;
  const accessTokenParam = route.query.access_token;

  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const errorDescription = Array.isArray(descriptionParam)
    ? descriptionParam[0]
    : descriptionParam;
  const authStatus = Array.isArray(authStatusParam)
    ? authStatusParam[0]
    : authStatusParam;
  const accessToken = Array.isArray(accessTokenParam)
    ? accessTokenParam[0]
    : accessTokenParam;

  const pendingAuthState = getPendingAuthState();
  const redirectTo =
    pendingAuthState?.redirectTo ?? router.resolve(RouteHelper.home()).href;

  if (errorCode) {
    clearPendingAuthState();
    clearSecurityAccess();
    await alert(errorCode, errorDescription || "알 수 없는 오류가 발생했습니다.");
    await router.replace(RouteHelper.auth.login());
    return;
  }

  if (accessToken) {
    authStore.setAccessToken(accessToken);
  }

  const shouldRestoreAuth = Boolean(accessToken) || authStatus === "LINK_SUCCESS";
  if (shouldRestoreAuth) {
    try {
      await authStore.initializeAuth();
    } catch (error) {
      console.error("OAuth callback auth restore failed:", error);
      clearPendingAuthState();
      clearSecurityAccess();
      await alert("로그인 필요", "인증 정보를 복구하지 못했습니다. 다시 로그인해 주세요.");
      await router.replace(RouteHelper.auth.login());
      return;
    }

    if (!authStore.isLoggedIn) {
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

  if (pendingAuthState?.grantSecurityAccess && authStore.userId) {
    grantSecurityAccess(authStore.userId);
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
