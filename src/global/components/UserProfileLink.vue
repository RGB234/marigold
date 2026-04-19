<script setup lang="ts">
import { useRouter } from 'vue-router';
import { RouteHelper } from '@/global/router/routeHelper';
import type { TSID_String } from '@/global/types/common';
import defaultProfileImage from '@/assets/images/default-profile.png';


const props = defineProps<{
  userId?: TSID_String | null;
  nickname?: string;
  imageUrl?: string | null;
  showImage?: boolean;
  imageSize?: string;
}>();

const router = useRouter();

const defaultImage = defaultProfileImage

const goToProfile = (event: Event) => {
  // 이벤트 버블링 방지 (목록 등에서 클릭 시 다른 액션이 트리거되는 것 방지)
  event.stopPropagation();
  
  if (!props.userId) return;
  
  router.push(RouteHelper.user.profile(props.userId.toString()));
};
</script>

<template>
  <div 
    class="user-profile-link" 
    :class="{ 'is-clickable': !!userId }"
    @click="goToProfile"
  >
    <img 
      v-if="showImage" 
      :src="imageUrl ?? defaultImage" 
      alt="프로필" 
      class="profile-img"
      :style="{ width: imageSize || '40px', height: imageSize || '40px' }"
      @error="(e) => (e.target as HTMLImageElement).src = defaultImage"
    />
    <span class="nickname">{{ nickname || '알 수 없음' }}</span>
  </div>
</template>

<style scoped>
.user-profile-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: inherit;
}

.user-profile-link.is-clickable {
  cursor: pointer;
}

.user-profile-link.is-clickable:hover .nickname {
  text-decoration: underline;
  color: #2196f3;
}

.profile-img {
  border-radius: 50%;
  object-fit: cover;
  background-color: #f0f0f0;
}

.nickname {
  font-weight: 500;
  transition: color 0.2s;
}
</style>
