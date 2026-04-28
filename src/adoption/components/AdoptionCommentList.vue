<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { getAdoptionComments } from '@/adoption/api/adoptionPost.api';
import { AdoptionCommentResponse } from '@/adoption/types/adoptionPost.ts';
import AdoptionCommentItem from './AdoptionCommentItem.vue';
import AdoptionCommentInput from './AdoptionCommentInput.vue';

const props = defineProps<{
  postId: string | number;
  canComment: boolean;
}>();

const comments = ref<AdoptionCommentResponse[]>([]);
const loading = ref(true);

interface FlattenedCommentItem {
  comment: AdoptionCommentResponse;
  depth: number;
  parentLabel: string | null;
}

const fetchComments = async () => {
  loading.value = true;
  try {
    comments.value = await getAdoptionComments(props.postId);
  } catch (error) {
    console.error("댓글 목록을 불러오는 중 오류 발생:", error);
  } finally {
    loading.value = false;
  }
};

watch(() => props.postId, () => {
  fetchComments();
});

onMounted(() => {
  fetchComments();
});

const onCommentCreated = () => {
  fetchComments();
};

const onCommentRefresh = () => {
  fetchComments();
};

const flattenedComments = computed<FlattenedCommentItem[]>(() => {
  const items: FlattenedCommentItem[] = [];

  const traverse = (
    comment: AdoptionCommentResponse,
    depth = 0,
    parentLabel: string | null = null,
  ) => {
    items.push({ comment, depth, parentLabel });

    const currentLabel = comment.writer?.nickname ?? '삭제된 댓글';
    comment.children?.forEach((child) => traverse(child, depth + 1, currentLabel));
  };

  comments.value.forEach((comment) => traverse(comment));

  return items;
});
</script>

<template>
  <div class="comment-section">
    <h3>댓글</h3>

    <!-- 댓글 목록 -->
    <div v-if="loading" class="loading">
      댓글을 불러오는 중...
    </div>
    
    <div v-else-if="comments.length === 0" class="empty-comments">
      아직 등록된 댓글이 없습니다.
    </div>

    <div v-else class="comments-list">
      <AdoptionCommentItem 
        v-for="item in flattenedComments" 
        :key="item.comment.id" 
        :comment="item.comment" 
        :postId="postId" 
        :canComment="canComment" 
        :depth="item.depth"
        :parentLabel="item.parentLabel"
        @refresh="onCommentRefresh" 
      />
    </div>

    <!-- 새 댓글 입력창 -->
    <div v-if="canComment" class="new-comment-wrapper">
      <h4>새 댓글 작성</h4>
      <AdoptionCommentInput 
        :postId="postId" 
        @comment-created="onCommentCreated"
      />
    </div>
    <div v-else class="no-permission-msg">
      댓글은 작성자 및 입양 확정자만 작성할 수 있습니다.
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 2px solid #eee;
}

.comment-section h3 {
  font-size: 20px;
  margin-bottom: 20px;
  color: #333;
}

.loading, .empty-comments {
  padding: 24px 0;
  text-align: center;
  color: #888;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 24px;
}

.comments-list {
  margin-bottom: 32px;
}

.new-comment-wrapper {
  margin-top: 32px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.02);
}

.new-comment-wrapper h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: #555;
}

.no-permission-msg {
  margin-top: 24px;
  padding: 16px;
  background: #f5f5f5;
  color: #777;
  text-align: center;
  border-radius: 8px;
  font-size: 14px;
}
</style>
