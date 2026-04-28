<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { RouteHelper } from '@/global/router/routeHelper';
import type { TSID_String } from '@/global/types/common';
import type { UserStatus } from '@/user/types/user';
import defaultProfileImage from '@/assets/images/default-profile.png';

const props = defineProps<{
  userId?: TSID_String | null;
  nickname?: string;
  imageUrl?: string | null;
  status?: UserStatus | null;
  showImage?: boolean;
  imageSize?: string;
}>();

const router = useRouter();

const isDeletedUser = computed(() => props.status === 'DELETED');

const displayNickname = computed(() => {
  if (isDeletedUser.value) {
    return '탈퇴한 유저';
  }
  return props.nickname || '알 수 없음';
});

const displayImage = computed(() => {
  if (isDeletedUser.value) {
    return defaultProfileImage;
  }
  return props.imageUrl ?? defaultProfileImage;
});

const isClickable = computed(() => {
  return !!props.userId && !isDeletedUser.value;
});

const goToProfile = (event: Event) => {
  event.stopPropagation();

  if (!isClickable.value || !props.userId) return;

  router.push(RouteHelper.user.profile(props.userId.toString()));
};
</script>

<template>
  <div
    class="user-profile-link"
    :class="{ 'is-clickable': isClickable }"
    @click="goToProfile"
  >
    <img
      v-if="showImage"
      :src="displayImage"
      alt="프로필"
      class="profile-img"
      :style="{ width: imageSize || '40px', height: imageSize || '40px' }"
      @error="(e) => (e.target as HTMLImageElement).src = defaultProfileImage"
    />
    <span class="nickname" :class="{ 'is-deleted': isDeletedUser }">{{ displayNickname }}</span>
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

.nickname.is-deleted {
  color: #777;
}
</style>
