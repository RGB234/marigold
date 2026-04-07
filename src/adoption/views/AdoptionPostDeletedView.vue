<script setup lang="ts">
import { useRouter } from 'vue-router';
import { RouteHelper } from '@/global/router/routeHelper';

const router = useRouter();

const goToList = () => {
  router.push(RouteHelper.adoption.list());
};
</script>

<template>
  <div class="deleted-container">
    <div class="deleted-content">
      <h2>삭제된 게시글입니다.</h2>
      <p>이 게시글은 작성자에 의해 삭제되었습니다.</p>
      <button class="btn primary" @click="goToList">목록으로 돌아가기</button>
    </div>
  </div>
</template>

<style scoped>
.deleted-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 20px;
}

.deleted-content {
  background: white;
  padding: 60px 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 12px;
}

p {
  color: #666;
  font-size: 16px;
  margin-bottom: 30px;
}

.btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  font-size: 15px;
  transition: background 0.2s;
}

.btn.primary {
  background-color: #ff9800;
  color: white;
}

.btn.primary:hover {
  background-color: #e68a00;
}
</style>