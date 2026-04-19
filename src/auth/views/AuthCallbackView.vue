<template>
      <div>
            <h4>처리 중... 잠시만 기다려주세요.</h4>
      </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from "vue-router";
import { useAlert } from "@/global/composables/useAlert";
import { useAuthStore } from "@/auth/stores/auth";

const route = useRoute();
const router = useRouter();
const { alert } = useAlert();
const authStore = useAuthStore();

onMounted(async () => {
  await handleOAuthCallback();
});

async function handleOAuthCallback() {
  // 배열 형태로 들어올 경우를 대비해 첫 번째 값을 안전하게 추출하거나 문자열로 변환
  const errorParam = route.query.error;
  const descParam = route.query.error_description;
  const authStatusParam = route.query.auth_status;
  const accessTokenParam = route.query.access_token;

  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const errorDescription = Array.isArray(descParam) ? descParam[0] : descParam;
  const authStatus = Array.isArray(authStatusParam) ? authStatusParam[0] : authStatusParam;
  const accessToken = Array.isArray(accessTokenParam) ? accessTokenParam[0] : accessTokenParam;

  if (errorCode) {
    alert(errorCode, errorDescription || "알 수 없는 에러가 발생했습니다.");
    router.replace({ name: "Login" }); 
    return;
  }

  // Access Token 저장
  if (accessToken) {
    authStore.setAccessToken(accessToken);

    await authStore.initializeAuth();
  }
  
  switch(authStatus) {
    case 'SIGNUP_SUCCESS':
      // TODO: 신규가입 환영 모달 띄우기 또는 온보딩 화면으로 이동
      router.replace({ name: "Home" });
      break;
    case 'BANNED':
      alert("정지된 계정", "관리자에 의해 정지된 계정입니다.");
      router.replace({ name: "Login" });
      break;
    case 'SLEEP':
      alert("휴면 계정", "휴면 상태인 계정입니다. 해제가 필요합니다.");
      // TODO: 휴면 해제 화면으로 이동
      router.replace({ name: "Home" });
      break;
    case 'DELETED':
      alert("탈퇴한 계정", "탈퇴 처리된 계정입니다. 재가입이 필요합니다.");
      router.replace({ name: "Login" });
      break;
    case 'LOGIN_SUCCESS':
    default:
      // 정상 메인 홈으로
      router.replace({ name: "Home" });
      break;
  }
}
</script>