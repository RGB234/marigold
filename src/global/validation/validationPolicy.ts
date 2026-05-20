import policy from "./validation-policy.json";

export interface ValidationPolicy {
  version: number;
  email: {
    pattern: string;
  };
  password: {
    minLength: number;
  };
  user: {
    nickname: {
      minLength: number;
      maxLength: number;
      allowedPattern: string;
    };
  };
  adoptionPost: {
    age: {
      min: number;
    };
    weight: {
      min: number;
    };
    title: {
      maxLength: number;
    };
    features: {
      minLength: number;
      maxLength: number;
    };
    images: {
      minCount: number;
      maxCount: number;
    };
  };
  comment: {
    content: {
      maxLength: number;
    };
    images: {
      minCount: number;
      maxCount: number;
    };
  };
  image: {
    maxSizeMb: number;
    maxSizeBytes: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
  };
  chatAttachment: {
    maxCount: number;
    maxFileSizeBytes: number;
    maxTotalSizeBytes: number;
    allowedExtensions: string[];
    allowedMimeTypesByExtension: Record<string, string[]>;
  };
  tsid: {
    base32Length: number;
    base32Pattern: string;
  };
}

export const validationPolicy = policy as ValidationPolicy;
