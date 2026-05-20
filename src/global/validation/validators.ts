import type { ErrorDetail } from "@/global/types/common";
import { validationPolicy } from "@/global/validation/validationPolicy";

export type ValidationError = ErrorDetail;

interface ImageValidationOptions {
  field: string;
  minCount: number;
  maxCount: number;
  existingCount?: number;
}

interface AdoptionPostFormValues {
  title: string;
  age: number | string;
  area: string;
  weight: number | string;
  features: string;
}

const emailRegex = new RegExp(validationPolicy.email.pattern);
const nicknameRegex = new RegExp(validationPolicy.user.nickname.allowedPattern);
const tsidRegex = new RegExp(validationPolicy.tsid.base32Pattern, "i");

export const compactValidationErrors = (
  errors: Array<ValidationError | null>,
): ValidationError[] => {
  return errors.filter((error): error is ValidationError => error !== null);
};

export const getFileExtension = (fileName: string) => {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
};

export const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

export const validateEmail = (email: string, field = "email"): ValidationError | null => {
  if (!email.trim()) {
    return { field, message: "이메일은 필수입니다." };
  }

  if (!emailRegex.test(email)) {
    return { field, message: "이메일 형식이 올바르지 않습니다." };
  }

  return null;
};

export const validatePassword = (
  password: string,
  field = "password",
): ValidationError | null => {
  if (!password) {
    return { field, message: "비밀번호는 필수입니다." };
  }

  if (password.length < validationPolicy.password.minLength) {
    return {
      field,
      message: `비밀번호는 ${validationPolicy.password.minLength}자 이상이어야 합니다.`,
    };
  }

  return null;
};

export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string,
  field = "confirmPassword",
): ValidationError | null => {
  if (!confirmPassword) {
    return { field, message: "비밀번호 확인을 입력해 주세요." };
  }

  if (password !== confirmPassword) {
    return { field, message: "비밀번호 확인이 일치하지 않습니다." };
  }

  return null;
};

export const validateNickname = (
  nickname: string,
  field = "nickname",
): ValidationError | null => {
  const trimmedNickname = nickname.trim();
  const { minLength, maxLength } = validationPolicy.user.nickname;

  if (!trimmedNickname) {
    return { field, message: "닉네임은 필수입니다." };
  }

  if (
    trimmedNickname.length < minLength ||
    trimmedNickname.length > maxLength ||
    !nicknameRegex.test(trimmedNickname)
  ) {
    return {
      field,
      message: `닉네임은 ${minLength}자 이상 ${maxLength}자 이하의 한글, 영문, 숫자만 사용할 수 있습니다.`,
    };
  }

  return null;
};

export const validateTsid = (id: string | null | undefined) => {
  return !!id && tsidRegex.test(id);
};

export const validateImageCount = (
  count: number,
  field: string,
  minCount: number,
  maxCount: number,
): ValidationError | null => {
  if (count < minCount || count > maxCount) {
    return {
      field,
      message: `이미지는 최소 ${minCount}개, 최대 ${maxCount}개까지 업로드 가능합니다.`,
    };
  }

  return null;
};

export const validateImageFiles = (
  files: File[],
  options: ImageValidationOptions,
): ValidationError | null => {
  const { field, minCount, maxCount, existingCount = 0 } = options;
  const allowedMimeTypes = validationPolicy.image.allowedMimeTypes;
  const allowedExtensions = validationPolicy.image.allowedExtensions;

  for (const file of files) {
    const extension = getFileExtension(file.name);
    const isAllowedType = file.type
      ? allowedMimeTypes.includes(file.type)
      : allowedExtensions.includes(extension);

    if (!isAllowedType) {
      return { field, message: "JPG, JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다." };
    }

    if (file.size > validationPolicy.image.maxSizeBytes) {
      return {
        field,
        message: `파일 크기는 최대 ${validationPolicy.image.maxSizeMb}MB까지 가능합니다. (${file.name})`,
      };
    }
  }

  return validateImageCount(existingCount + files.length, field, minCount, maxCount);
};

export const validateAdoptionPostForm = (
  form: AdoptionPostFormValues,
  imageCount: number,
): ValidationError[] => {
  const errors: ValidationError[] = [];
  const title = form.title.trim();
  const area = form.area.trim();
  const features = form.features.trim();
  const age = Number(form.age);
  const weight = Number(form.weight);
  const policy = validationPolicy.adoptionPost;

  if (!title) {
    errors.push({ field: "title", message: "값이 비어있습니다." });
  } else if (title.length > policy.title.maxLength) {
    errors.push({ field: "title", message: `제목은 ${policy.title.maxLength}자 이하여야 합니다.` });
  }

  if (Number.isNaN(age) || age < policy.age.min) {
    errors.push({ field: "age", message: `나이는 ${policy.age.min} 이상이어야 합니다.` });
  }

  if (!area) {
    errors.push({ field: "area", message: "값이 비어있습니다." });
  }

  if (Number.isNaN(weight) || weight < policy.weight.min) {
    errors.push({ field: "weight", message: `무게는 ${policy.weight.min} 이상이어야 합니다.` });
  }

  if (!features) {
    errors.push({ field: "features", message: "값이 비어있습니다." });
  } else if (
    features.length < policy.features.minLength ||
    features.length > policy.features.maxLength
  ) {
    errors.push({
      field: "features",
      message: `${policy.features.minLength}자 이상 ${policy.features.maxLength}자 이하여야 합니다.`,
    });
  }

  const imageError = validateImageCount(
    imageCount,
    "images",
    policy.images.minCount,
    policy.images.maxCount,
  );
  if (imageError) {
    errors.push(imageError);
  }

  return errors;
};

export const validateCommentContent = (
  content: string,
  field = "content",
): ValidationError | null => {
  if (!content.trim()) {
    return { field, message: "내용이 비어있습니다." };
  }

  if (content.length > validationPolicy.comment.content.maxLength) {
    return {
      field,
      message: `댓글은 ${validationPolicy.comment.content.maxLength}자 이하여야 합니다.`,
    };
  }

  return null;
};

export const validateChatAttachmentFiles = (
  files: File[],
  existingFiles: File[] = [],
): ValidationError | null => {
  const nextFiles = [...existingFiles, ...files];
  const policy = validationPolicy.chatAttachment;

  if (nextFiles.length > policy.maxCount) {
    return { field: "files", message: `파일은 최대 ${policy.maxCount}개까지 첨부할 수 있습니다.` };
  }

  for (const file of files) {
    const extension = getFileExtension(file.name);

    if (file.size <= 0 || !policy.allowedExtensions.includes(extension)) {
      return { field: "files", message: "지원하지 않는 파일 형식입니다." };
    }

    if (file.size > policy.maxFileSizeBytes) {
      return {
        field: "files",
        message: `파일 1개는 ${formatFileSize(policy.maxFileSizeBytes)} 이하여야 합니다.`,
      };
    }
  }

  const totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > policy.maxTotalSizeBytes) {
    return {
      field: "files",
      message: `첨부 파일 총 용량은 ${formatFileSize(policy.maxTotalSizeBytes)} 이하여야 합니다.`,
    };
  }

  return null;
};
