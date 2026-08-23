// src/lib/file-validation.ts

export type UploadCategory = 'AVATAR' | 'COVER' | 'MEDIA' | 'GALLERY' | 'PAYMENT_PROOF';

export interface UploadCategoryConfig {
  maxBytes: number;
  maxMb: number;
  allowedMimeTypes: string[];
  label: string;
}

export const UPLOAD_CONFIGS: Record<UploadCategory, UploadCategoryConfig> = {
  AVATAR: {
    maxBytes: 2 * 1024 * 1024,
    maxMb: 2,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'Profile / Member Portrait',
  },
  COVER: {
    maxBytes: 3 * 1024 * 1024,
    maxMb: 3,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'Cover Artwork',
  },
  MEDIA: {
    maxBytes: 5 * 1024 * 1024,
    maxMb: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    label: 'Event Poster / Media / Achievement / Card',
  },
  GALLERY: {
    maxBytes: 10 * 1024 * 1024,
    maxMb: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    label: 'Community Gallery Image',
  },
  PAYMENT_PROOF: {
    maxBytes: 10 * 1024 * 1024,
    maxMb: 10,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    label: 'Payment Proof (Image or PDF)',
  },
};

export const ACCEPT_MAP: Record<UploadCategory, string> = {
  AVATAR: 'image/jpeg,image/png,image/webp',
  COVER: 'image/jpeg,image/png,image/webp',
  MEDIA: 'image/jpeg,image/png,image/webp',
  GALLERY: 'image/jpeg,image/png,image/webp,image/gif',
  PAYMENT_PROOF: 'image/jpeg,image/png,image/webp,image/gif,application/pdf',
};

/**
 * Validates a file or Blob against category constraints.
 */
export function validateUploadFile(
  file: { size: number; type: string; name?: string } | null | undefined,
  category: UploadCategory = 'MEDIA'
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file was selected.' };
  }

  const config = UPLOAD_CONFIGS[category];

  // 1. MIME format check
  const fileType = file.type?.toLowerCase() || '';
  if (!config.allowedMimeTypes.includes(fileType)) {
    const readableTypes = config.allowedMimeTypes
      .map((t) => {
        if (t === 'application/pdf') return 'PDF';
        return t.replace('image/', '').toUpperCase();
      })
      .join(', ');
    return {
      valid: false,
      error: `Invalid file format. Please upload a ${readableTypes} file.`,
    };
  }

  // 2. Size check
  if (file.size === 0) {
    return { valid: false, error: 'File appears to be empty.' };
  }

  if (file.size > config.maxBytes) {
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size is ${fileSizeMb}MB. Maximum allowed is ${config.maxMb}MB.`,
    };
  }

  return { valid: true };
}
