<script setup lang="ts">
import { ref, computed } from 'vue';
import { createAdoptionComment } from '@/adoption/api/adoptionPost.api';
import { useAlert } from '@/global/composables/useAlert';

const props = defineProps<{
  postId: string | number;
  parentId?: string | number;
}>();

const emit = defineEmits<{
  (e: 'comment-created'): void;
  (e: 'cancel'): void;
}>();

const { toast } = useAlert();

const content = ref('');
const images = ref<File[]>([]);
const imagePreviews = ref<string[]>([]);
const isSubmitting = ref(false);

const handleImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;

  const files = Array.from(target.files);
  if (images.value.length + files.length > 8) {
    toast.error('이미지는 최대 8개까지 첨부할 수 있습니다.');
    return;
  }

  files.forEach(file => {
    images.value.push(file);
    imagePreviews.value.push(URL.createObjectURL(file));
  });
  
  target.value = ''; // input 초기화
};

const removeImage = (index: number) => {
  URL.revokeObjectURL(imagePreviews.value[index]);
  images.value.splice(index, 1);
  imagePreviews.value.splice(index, 1);
};

const submitComment = async () => {
  if (!content.value.trim()) {
    toast.error('댓글 내용을 입력해주세요.');
    return;
  }

  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('content', content.value);
    if (props.parentId) {
      formData.append('parentId', props.parentId.toString());
    }
    images.value.forEach(file => {
      formData.append('images', file);
    });

    await createAdoptionComment(props.postId, formData);
    toast.success('댓글이 등록되었습니다.');
    
    // 초기화
    content.value = '';
    images.value.forEach((_, idx) => URL.revokeObjectURL(imagePreviews.value[idx]));
    images.value = [];
    imagePreviews.value = [];
    
    emit('comment-created');
  } catch (error) {
    console.error(error);
    toast.error('댓글 등록 중 오류가 발생했습니다.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="comment-input-container">
    <textarea v-model="content" placeholder="댓글을 입력하세요..." :disabled="isSubmitting" class="comment-textarea"></textarea>
    
    <div class="image-previews" v-if="imagePreviews.length > 0">
      <div v-for="(preview, index) in imagePreviews" :key="index" class="preview-item">
        <img :src="preview" alt="미리보기" />
        <button class="btn-remove" @click="removeImage(index)">×</button>
      </div>
    </div>
    
    <div class="input-actions">
      <label class="btn-upload" :class="{ disabled: images.length >= 8 || isSubmitting }">
        이미지 첨부 ({{ images.length }}/8)
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          @change="handleImageChange" 
          :disabled="images.length >= 8 || isSubmitting" 
          hidden 
        />
      </label>
      
      <div class="right-actions">
        <button v-if="parentId" class="btn-cancel" @click="$emit('cancel')" :disabled="isSubmitting">취소</button>
        <button class="btn-submit" @click="submitComment" :disabled="isSubmitting">등록</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-input-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  background-color: #fafafa;
  margin-top: 10px;
}

.comment-textarea {
  width: 100%;
  min-height: 80px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 8px;
}

.image-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-item {
  position: relative;
  width: 60px;
  height: 60px;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.btn-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-actions {
  display: flex;
  gap: 8px;
}

.btn-upload {
  font-size: 13px;
  color: #666;
  background: #eee;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
}

.btn-upload.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: white;
  border: 1px solid #ddd;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-submit {
  background: #ff9800;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
