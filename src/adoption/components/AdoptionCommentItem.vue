<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { AdoptionCommentResponse } from '@/adoption/types/adoptionPost.ts';
import AdoptionCommentInput from './AdoptionCommentInput.vue';
import UserProfileLink from '@/global/components/UserProfileLink.vue';
import { useAuthStore } from '@/auth/stores/auth';
import { deleteAdoptionComment, updateAdoptionComment } from '@/adoption/api/adoptionPost.api';
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
const isEditing = ref(false);
const isUpdating = ref(false);
const editContent = ref(props.comment.content);
const selectedImageUrl = ref<string | null>(null);
const editImage = ref<File | null>(null);
const editImagePreview = ref<string | null>(null);
const removeImageOnEdit = ref(false);
const editImageInputRef = ref<HTMLInputElement | null>(null);
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
const imageAccept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

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

const isEdited = computed(() => {
  if (isDeleted.value || !props.comment.modifiedAt) {
    return false;
  }

  const createdAt = new Date(props.comment.createdAt).getTime();
  const modifiedAt = new Date(props.comment.modifiedAt).getTime();

  if (Number.isNaN(createdAt) || Number.isNaN(modifiedAt)) {
    return props.comment.createdAt !== props.comment.modifiedAt;
  }

  return createdAt !== modifiedAt;
});

const displayDate = computed(() => {
  return isEdited.value ? props.comment.modifiedAt : props.comment.createdAt;
});

const canShowImages = computed(() => {
  return !isDeleted.value && props.comment.imageUrls && props.comment.imageUrls.length > 0;
});

const currentEditImageUrl = computed(() => {
  if (removeImageOnEdit.value || editImagePreview.value) {
    return null;
  }

  return props.comment.imageUrls?.[0] ?? null;
});

const editImagePreviewUrl = computed(() => {
  return editImagePreview.value ?? currentEditImageUrl.value;
});

watch(
  () => props.comment.content,
  (content) => {
    if (!isEditing.value) {
      editContent.value = content;
    }
  },
);

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

const isAllowedImageFile = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return (
    allowedImageTypes.includes(file.type) ||
    (file.type === '' && !!extension && allowedImageExtensions.includes(extension))
  );
};

const clearEditImageInput = () => {
  if (editImageInputRef.value) {
    editImageInputRef.value.value = '';
  }
};

const revokeEditImagePreview = () => {
  if (editImagePreview.value) {
    URL.revokeObjectURL(editImagePreview.value);
  }
};

const resetEditImageState = () => {
  revokeEditImagePreview();
  editImage.value = null;
  editImagePreview.value = null;
  removeImageOnEdit.value = false;
  clearEditImageInput();
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

const startEdit = () => {
  editContent.value = props.comment.content;
  resetEditImageState();
  isEditing.value = true;
  showReplyInput.value = false;
};

const cancelEdit = () => {
  editContent.value = props.comment.content;
  resetEditImageState();
  isEditing.value = false;
};

const handleEditImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  if (!isAllowedImageFile(file)) {
    toast.error('JPG, JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
    clearEditImageInput();
    return;
  }

  revokeEditImagePreview();
  editImage.value = file;
  editImagePreview.value = URL.createObjectURL(file);
  removeImageOnEdit.value = false;
  clearEditImageInput();
};

const removeEditImage = () => {
  revokeEditImagePreview();
  editImage.value = null;
  editImagePreview.value = null;
  removeImageOnEdit.value = true;
  clearEditImageInput();
};

const submitEdit = async () => {
  if (!editContent.value.trim()) {
    toast.error('댓글 내용을 입력해주세요.');
    return;
  }

  const hasImageChange = !!editImage.value || removeImageOnEdit.value;

  if (editContent.value === props.comment.content && !hasImageChange) {
    isEditing.value = false;
    return;
  }

  isUpdating.value = true;
  try {
    const formData = new FormData();
    formData.append('content', editContent.value);
    formData.append('removeImage', String(removeImageOnEdit.value));
    if (editImage.value) {
      formData.append('images', editImage.value);
    }

    await updateAdoptionComment(props.postId, props.comment.id, formData);
    toast.success('댓글이 수정되었습니다.');
    resetEditImageState();
    isEditing.value = false;
    emit('refresh');
  } catch (error) {
    console.error(error);
    toast.error('댓글 수정 중 오류가 발생했습니다.');
  } finally {
    isUpdating.value = false;
  }
};

const openImagePopup = (imageUrl: string) => {
  selectedImageUrl.value = imageUrl;
};

const closeImagePopup = () => {
  selectedImageUrl.value = null;
};

const onCommentCreated = () => {
  showReplyInput.value = false;
  emit('refresh');
};

onBeforeUnmount(() => {
  revokeEditImagePreview();
});
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
          <span class="date">
            {{ formatDate(displayDate) }}
            <span v-if="isEdited" class="edited-label">(수정됨)</span>
          </span>
          <button v-if="isMyComment && !isDeleted && !isEditing" class="btn-edit" @click="startEdit">수정</button>
          <button v-if="isMyComment && !isDeleted && !isEditing" class="btn-delete" @click="handleDelete">삭제</button>
        </div>
      </div>

      <div v-if="isEditing" class="comment-edit-form">
        <textarea
          v-model="editContent"
          class="comment-edit-textarea"
          :disabled="isUpdating"
          maxlength="1000"
        ></textarea>
        <div class="comment-edit-image-area">
          <div v-if="editImagePreviewUrl" class="comment-edit-image-preview">
            <img :src="editImagePreviewUrl" alt="수정할 댓글 이미지" />
            <button
              type="button"
              class="btn-edit-image-remove"
              :disabled="isUpdating"
              @click="removeEditImage"
            >
              X
            </button>
          </div>
          <label class="btn-edit-image-upload" :class="{ disabled: isUpdating }">
            {{ editImagePreviewUrl ? '이미지 변경' : '이미지 첨부' }}
            <input
              ref="editImageInputRef"
              type="file"
              :accept="imageAccept"
              :disabled="isUpdating"
              hidden
              @change="handleEditImageChange"
            />
          </label>
        </div>
        <div class="comment-edit-actions">
          <button type="button" class="btn-edit-cancel" :disabled="isUpdating" @click="cancelEdit">
            취소
          </button>
          <button type="button" class="btn-edit-submit" :disabled="isUpdating" @click="submitEdit">
            저장
          </button>
        </div>
      </div>

      <template v-else>
        <div class="comment-text" :class="{ 'deleted-comment': isDeleted }">
          <span v-if="isReply" class="reply-parent">
            @{{ replyParentLabel }}
          </span>
          {{ displayContent }}
        </div>

        <div v-if="canShowImages" class="comment-images">
          <button
            v-for="(img, idx) in comment.imageUrls"
            :key="idx"
            type="button"
            class="image-button"
            @click="openImagePopup(img)"
          >
            <img :src="img" alt="댓글 이미지" />
          </button>
        </div>
      </template>

      <div v-if="canComment && !isEditing" class="comment-actions">
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

    <Teleport to="body">
      <div v-if="selectedImageUrl" class="comment-image-popup-overlay" @click.self="closeImagePopup">
        <div class="comment-image-popup-content">
          <button
            type="button"
            class="comment-image-popup-close"
            aria-label="댓글 이미지 팝업 닫기"
            @click="closeImagePopup"
          >
            X
          </button>
          <img :src="selectedImageUrl" alt="확대 댓글 이미지" class="comment-image-popup-img" />
        </div>
      </div>
    </Teleport>
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

.edited-label {
  margin-left: 4px;
  color: #777;
}

.btn-edit {
  background: none;
  border: none;
  color: #2196f3;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
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

.comment-edit-form {
  margin-bottom: 12px;
}

.comment-edit-textarea {
  width: 100%;
  min-height: 72px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  box-sizing: border-box;
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.comment-edit-image-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.comment-edit-image-preview {
  position: relative;
  width: 80px;
  height: 80px;
}

.comment-edit-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.btn-edit-image-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: #f44336;
  color: white;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.btn-edit-image-upload {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
  color: #555;
  font-size: 13px;
  cursor: pointer;
}

.btn-edit-image-upload.disabled,
.btn-edit-image-remove:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-edit-cancel,
.btn-edit-submit {
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}

.btn-edit-cancel {
  background: #f0f0f0;
  color: #333;
}

.btn-edit-submit {
  background: #ff9800;
  color: white;
  font-weight: 600;
}

.btn-edit-cancel:disabled,
.btn-edit-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.image-button {
  display: block;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.image-button img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.comment-image-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.78);
}

.comment-image-popup-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(90vw, 1000px);
  height: min(80vh, 760px);
}

.comment-image-popup-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
}

.comment-image-popup-close {
  position: absolute;
  top: -16px;
  right: -16px;
  z-index: 1;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.comment-image-popup-close:hover {
  background: #fff;
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
