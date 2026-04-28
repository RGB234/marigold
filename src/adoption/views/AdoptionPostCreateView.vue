<template>
  <section>
    <div class="writing-wrap">
      <div class="writing-header">
        <h1>입양글 작성</h1>
      </div>

      <div class="writing-content">
        <div class="field">
          <label for="species" class="required">종</label>
          <select id="species" v-model="form.species">
            <option :value="Species.DOG">개</option>
            <option :value="Species.CAT">고양이</option>
            <option :value="Species.RODENTS">설치류</option>
            <option :value="Species.BIRDS">조류</option>
            <option :value="Species.REPTILES">파충류</option>
            <option :value="Species.OTHER">기타 동물</option>
          </select>
          <div v-if="errors.species" class="error">{{ errors.species }}</div>
        </div>

        <div class="field">
          <label for="title" class="required">제목</label>
          <input id="title" v-model="form.title" type="text" />
          <div v-if="errors.title" class="error">{{ errors.title }}</div>
        </div>

        <div class="field">
          <label for="age" class="required">나이</label>
          <input id="age" v-model="form.age" type="number" />
          <div v-if="errors.age" class="error">{{ errors.age }}</div>
        </div>

        <div class="field">
          <label for="sex" class="required">성별</label>
          <select id="sex" v-model="form.sex">
            <option :value="Sex.FEMALE">암컷</option>
            <option :value="Sex.MALE">수컷</option>
            <option :value="Sex.UNKNOWN">불명(모름)</option>
            <option :value="Sex.OTHER">기타</option>
          </select>
          <div v-if="errors.sex" class="error">{{ errors.sex }}</div>
        </div>

        <div class="field">
          <label for="area" class="required">위치</label>
          <input id="area" v-model="form.area" type="text" />
          <div v-if="errors.area" class="error">{{ errors.area }}</div>
        </div>

        <div class="field">
          <label for="weight" class="required">체중</label>
          <input id="weight" v-model="form.weight" type="number" />
          <div v-if="errors.weight" class="error">{{ errors.weight }}</div>
        </div>

        <div class="field">
          <label for="neutering" class="required">중성화 여부</label>
          <select id="neutering" v-model="form.neutering">
            <option :value="Neutering.YES">예</option>
            <option :value="Neutering.NO">아니오</option>
            <option :value="Neutering.UNKNOWN">불명</option>
          </select>
          <div v-if="errors.neutering" class="error">{{ errors.neutering }}</div>
        </div>

        <div class="field full">
          <label for="features" class="required">특징</label>
          <textarea id="features" v-model="form.features" rows="4"></textarea>
          <div v-if="errors.features" class="error">{{ errors.features }}</div>
        </div>

        <div class="field full">
          <span class="required field-label">이미지 (최대 {{ MAX_IMAGE_COUNT }}개)</span>
          <input
            id="images"
            ref="fileInputRef"
            type="file"
            accept="image/jpeg, image/png, image/webp"
            multiple
            class="file-input-hidden"
            @change="handleImageChange"
          />

          <div class="image-upload-area">
            <div class="image-preview-container">
              <div
                v-for="(preview, index) in imagePreviews"
                :key="index"
                class="image-preview"
              >
                <img
                  :src="preview"
                  :alt="`미리보기 ${index + 1}`"
                  @click="openLightbox(index)"
                />
                <button
                  type="button"
                  class="remove-image"
                  title="이미지 제거"
                  @click="removeImage(index)"
                >
                  X
                </button>
              </div>

              <label
                v-if="imagePreviews.length < MAX_IMAGE_COUNT"
                for="images"
                class="image-add-btn"
                title="이미지 추가"
              >
                <span class="image-add-icon">+</span>
                <span class="image-add-text">{{ imagePreviews.length === 0 ? "이미지 추가" : "" }}</span>
              </label>
            </div>
          </div>

          <div v-if="errors.images" class="error">{{ errors.images }}</div>
        </div>

        <Teleport to="body">
          <div v-if="lightboxIndex !== null" class="lightbox-overlay" @click.self="closeLightbox">
            <button type="button" class="lightbox-close" @click="closeLightbox">X</button>
            <img
              :src="imagePreviews[lightboxIndex]"
              class="lightbox-img"
              :alt="`이미지 ${lightboxIndex + 1}`"
            />
          </div>
        </Teleport>
      </div>

      <div class="btn-row">
        <button type="button" class="button secondary" @click="handleCancel">
          취소
        </button>
        <button type="button" class="button" @click="handleSubmit">
          제출
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { createAdoptionPost } from "@/adoption/api/adoptionPost.api";
import { Neutering } from "@/adoption/enums/Neutering";
import { Sex } from "@/adoption/enums/Sex";
import { Species } from "@/adoption/enums/Species";
import { useAlert } from "@/global/composables/useAlert";
import { RouteHelper } from "@/global/router/routeHelper";
import type { ErrorDetail } from "@/global/types/common";
import { extractApiErrorResponse } from "@/global/utils/apiError";
import { convertToFormData } from "@/global/utils/objectUtils";

const MAX_IMAGE_COUNT = Number(import.meta.env.VITE_MAX_IMAGE_COUNT);
const MIN_IMAGE_COUNT = Number(import.meta.env.VITE_MIN_IMAGE_COUNT);
const MAX_FILE_SIZE = Number(import.meta.env.VITE_MAX_FILE_SIZE);

interface AdoptionForm {
  species: Species | string;
  title: string;
  age: number;
  sex: Sex | string;
  area: string;
  weight: number;
  neutering: Neutering | string;
  features: string;
  images: File[];
}

const form = reactive<AdoptionForm>({
  species: Species.DOG,
  title: "",
  age: 0,
  sex: Sex.UNKNOWN,
  area: "",
  weight: 0,
  neutering: Neutering.NO,
  features: "",
  images: [],
});

const errors = reactive<Record<keyof AdoptionForm, string>>({
  species: "",
  title: "",
  age: "",
  sex: "",
  area: "",
  weight: "",
  neutering: "",
  features: "",
  images: "",
});

const router = useRouter();
const { toast } = useAlert();
const imagePreviews = ref<string[]>([]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const lightboxIndex = ref<number | null>(null);

const openLightbox = (index: number) => {
  lightboxIndex.value = index;
};

const closeLightbox = () => {
  lightboxIndex.value = null;
};

const resetFieldErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key as keyof AdoptionForm] = "";
  });
};

const applyFieldErrors = (errorDetails?: ErrorDetail[]) => {
  if (!Array.isArray(errorDetails) || errorDetails.length === 0) {
    return false;
  }

  errorDetails.forEach((error) => {
    errors[error.field as keyof AdoptionForm] = error.message;
  });

  return true;
};

const clearFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files) {
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const newFiles = Array.from(target.files);

  for (const file of newFiles) {
    if (!allowedTypes.includes(file.type)) {
      errors.images = "JPG, JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.";
      clearFileInput();
      return;
    }
  }

  for (const file of newFiles) {
    if (file.size > MAX_FILE_SIZE) {
      errors.images = `파일 크기는 최대 ${MAX_FILE_SIZE}MB까지 가능합니다. (${file.name})`;
      clearFileInput();
      return;
    }
  }

  const mergedImages = [...form.images, ...newFiles];
  if (mergedImages.length < MIN_IMAGE_COUNT || mergedImages.length > MAX_IMAGE_COUNT) {
    errors.images = `이미지는 최소 ${MIN_IMAGE_COUNT}개, 최대 ${MAX_IMAGE_COUNT}개까지 업로드 가능합니다.`;
    clearFileInput();
    return;
  }

  errors.images = "";
  form.images = mergedImages;

  newFiles.forEach((file) => {
    imagePreviews.value.push(URL.createObjectURL(file));
  });

  clearFileInput();
};

const removeImage = (index: number) => {
  const previewUrl = imagePreviews.value[index];
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }

  const nextImages = Array.from(form.images);
  nextImages.splice(index, 1);
  form.images = nextImages;
  imagePreviews.value.splice(index, 1);

  if (lightboxIndex.value !== null) {
    closeLightbox();
  }
};

const handleSubmit = async () => {
  resetFieldErrors();
  const formData = convertToFormData({ ...form }) as FormData;

  try {
    const response = await createAdoptionPost(formData);
    const createdPostId = response.data?.id;

    toast.success("입양글 작성이 완료되었습니다.");
    if (createdPostId) {
      await router.push(RouteHelper.adoption.detail(createdPostId.toString()));
    }
  } catch (error: unknown) {
    const apiError = extractApiErrorResponse(error);

    if (apiError) {
      const hasFieldErrors = applyFieldErrors(apiError.errors);
      if (!hasFieldErrors && apiError.message) {
        toast.error(apiError.message);
      }
      return;
    }

    console.error("입양글 작성 중 오류 발생:", error);
  }
};

const handleCancel = () => {
  router.push(RouteHelper.adoption.list());
};

onUnmounted(() => {
  imagePreviews.value.forEach((url) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  });
});
</script>

<style lang="css">
:root {
  --bg: #fbfdff;
  --card: #ffffff;
  --muted: #6b7280;
  --accent: #eaa221;
  --accent-dark: #d08a11;
  --border: #e6e9ee;
  --shadow: 0 6px 18px rgba(20, 24, 36, 0.06);
  --radius: 12px;
  --gap: 16px;
}

section {
  padding: 28px 16px;
  background: linear-gradient(180deg, var(--bg), #f6f8fb);
  color: #111827;
}

.writing-wrap {
  max-width: 920px;
  margin: 0 auto;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 22px;
}

.writing-header h1 {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.writing-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: calc(var(--gap) * 1.25);
  align-items: start;
}

.field {
  display: flex;
  flex-direction: column;
}

.field label,
.field .field-label {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 8px;
  font-weight: 600;
}

.field label.required::after {
  content: " *";
  color: #dc2626;
  font-weight: 700;
}

.field input[type="text"],
.field input[type="number"],
.field select,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    transform 0.08s ease;
  outline: none;
}

.field input::placeholder {
  color: #9aa3b2;
}

.field textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 6px 18px rgba(234, 162, 33, 0.12);
  transform: translateY(-1px);
}

.field select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--muted) 50%),
    linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(1em + 2px),
    calc(100% - 13px) calc(1em + 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  padding-right: 36px;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.writing-content .full {
  grid-column: 1 / -1;
}

@media (max-width: 720px) {
  .writing-wrap {
    padding: 18px;
  }

  .writing-content {
    grid-template-columns: 1fr;
  }
}

.btn-row {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 18px;
  grid-column: 1 / -1;
}

.button {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  background: var(--accent);
  color: white;
  box-shadow: 0 6px 12px rgba(208, 138, 17, 0.12);
  transition:
    transform 0.08s ease,
    filter 0.12s ease;
}

.button.secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  box-shadow: none;
}

.button:active {
  transform: translateY(1px) scale(0.998);
}

.button:hover {
  filter: brightness(0.98);
}

.field .error {
  margin-top: 6px;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.file-input-hidden {
  display: none;
}

.image-upload-area {
  margin-top: 4px;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease;
  flex-shrink: 0;
}

.image-preview:hover {
  transform: scale(1.02);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
  display: block;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease,
    transform 0.1s ease;
  z-index: 1;
}

.remove-image:hover {
  background: rgba(220, 38, 38, 1);
  transform: scale(1.1);
}

.remove-image:active {
  transform: scale(0.95);
}

.image-add-btn {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 2px dashed var(--border);
  background: #fafbfc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  flex-shrink: 0;
  user-select: none;
}

.image-add-btn:hover {
  border-color: var(--accent);
  background: #fff9f0;
}

.image-add-icon {
  font-size: 28px;
  line-height: 1;
  color: var(--muted);
}

.image-add-text {
  font-size: 11px;
  color: var(--muted);
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  border-radius: 10px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
  object-fit: contain;
}

.lightbox-close {
  position: fixed;
  top: 18px;
  right: 22px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  z-index: 10000;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
