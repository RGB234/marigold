<template>
      <div>
            <h4>처리 중... 잠시만 기다려주세요.</h4>
      </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from "vue-router";
import { useAlert } from "@/global/composables/useAlert";
import { HttpStatusCode } from 'axios';

const route = useRoute();
const router = useRouter();
const { alert, toast } = useAlert();

onMounted(() => {
  handleOAuthCallback();
});

function handleOAuthCallback() {
  // 배열 형태로 들어올 경우를 대비해 첫 번째 값을 안전하게 추출하거나 문자열로 변환
  const statusParam = route.query.status;
  const errorParam = route.query.error;
  const descParam = route.query.error_description;

  const statusCode = Array.isArray(statusParam) ? statusParam[0] : statusParam;
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const errorDescription = Array.isArray(descParam) ? descParam[0] : descParam;

  // 1. 에러 처리
  if (errorCode) {
    alert(errorCode, errorDescription || "알 수 없는 에러가 발생했습니다.");
    router.replace({ name: "Home" }); // push 대신 replace 사용
    return;
  }
  
  // 2. 성공 처리
  if (statusCode === HttpStatusCode.Created.toString()) {
    toast.success("회원가입 성공");
    router.replace({ name: "Home" });
    return;
  }

  if (statusCode === HttpStatusCode.Ok.toString()) {
    toast.success("로그인 성공");
    router.replace({ name: "Home" });
    return;
  }

  // 3. 예외 상황 (정상적인 콜백 파라미터가 없는 경우)
  router.replace({ name: "Home" }); 
}
</script>