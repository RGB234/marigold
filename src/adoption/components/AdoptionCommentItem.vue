<script setup lang="ts">
import { computed, ref } from 'vue';
import { AdoptionCommentResponse } from '@/adoption/types/adoptionPost.ts';
import AdoptionCommentInput from './AdoptionCommentInput.vue';
import UserProfileLink from '@/global/components/UserProfileLink.vue';
import { useAuthStore } from '@/auth/stores/auth';
import { deleteAdoptionComment } from '@/adoption/api/adoptionPost.api';
import { useAlert } from '@/global/composables/useAlert';

const props = defineProps<{
  comment: AdoptionCommentResponse;
  postId: string | number;
  canComment: boolean;
  depth: number;
  parentLabel: string | null;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const authStore = useAuthStore();
const { confirm, toast } = useAlert();

const showReplyInput = ref(false);

const isMyComment = computed(() => {
  return authStore.userId === props.comment.writer?.id;
});

const isDeleted = computed(() => {
  return props.comment.deleted;
});

const isReply = computed(() => props.depth > 0);

const replyParentLabel = computed(() => props.parentLabel ?? '삭제된 댓글');

const displayContent = computed(() => {
  return isDeleted.value ? '삭제된 댓글입니다' : props.comment.content;
});

const canShowImages = computed(() => {
  return !isDeleted.value && props.comment.imageUrls && props.comment.imageUrls.length > 0;
});

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleDelete = async () => {
  if (await confirm('경고', '댓글을 삭제하시겠습니까?')) {
    try {
      await deleteAdoptionComment(props.postId, props.comment.id);
      toast.success('댓글을 삭제했습니다.');
      emit('refresh');
    } catch (error) {
      console.error(error);
      toast.error('댓글 삭제 중 오류가 발생했습니다.');
    }
  }
};

const onCommentCreated = () => {
  showReplyInput.value = false;
  emit('refresh');
};
</script>

<template>
  <div class="comment-item" :class="{ 'is-reply': isReply }">
    <div class="comment-content-wrapper">
      <div class="comment-header">
        <UserProfileLink
          :userId="comment.writer?.id"
          :nickname="comment.writer?.nickname"
          :imageUrl="comment.writer?.imageUrl"
          :status="comment.writer?.status"
          :showImage="true"
        />
        <div class="comment-meta">
          <span class="date">{{ formatDate(comment.createdAt) }}</span>
          <button v-if="isMyComment && !isDeleted" class="btn-delete" @click="handleDelete">삭제</button>
        </div>
      </div>

      <div class="comment-text" :class="{ 'deleted-comment': isDeleted }">
        <span v-if="isReply" class="reply-parent">
          @{{ replyParentLabel }}
        </span>
        {{ displayContent }}
      </div>

      <div v-if="canShowImages" class="comment-images">
        <a v-for="(img, idx) in comment.imageUrls" :key="idx" :href="img" target="_blank" class="image-link">
          <img :src="img" alt="댓글 이미지" />
        </a>
      </div>

      <div v-if="canComment" class="comment-actions">
        <button class="btn-reply" @click="showReplyInput = !showReplyInput">
          {{ showReplyInput ? '답글 취소' : '답글 달기' }}
        </button>
      </div>
    </div>

    <div v-if="showReplyInput" class="reply-input-wrapper">
      <AdoptionCommentInput
        :postId="postId"
        :parentId="comment.id"
        @comment-created="onCommentCreated"
        @cancel="showReplyInput = false"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  border-bottom: 1px solid #eee;
  padding: 16px 0;
}

.comment-item.is-reply {
  padding-left: 32px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date {
  font-size: 12px;
  color: #888;
}

.btn-delete {
  background: none;
  border: none;
  color: #f44336;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  margin-bottom: 12px;
}

.comment-text.deleted-comment {
  color: #999;
  font-style: italic;
}

.reply-parent {
  color: #2f6fed;
  font-weight: 600;
  margin-right: 6px;
}

.comment-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.image-link img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.btn-reply {
  background: none;
  border: none;
  color: #2196f3;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.reply-input-wrapper {
  margin-top: 12px;
  margin-left: 24px;
}
</style>
