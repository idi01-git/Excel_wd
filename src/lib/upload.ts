// src/lib/upload.ts

export async function uploadImageBlob(
  blob: Blob,
  folder = 'avatars',
  filename = 'upload.jpg'
): Promise<string> {
  const isProof = folder === 'event-payment-proofs';
  const maxMb = isProof ? 5 : 10;
  const maxBytes = maxMb * 1024 * 1024;

  if (blob.size > maxBytes) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File is ${sizeMb}MB. Please upload an image with size less than ${maxMb}MB.`);
  }

  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let msg = errorData.error || 'Failed to upload image';
    if (msg.includes('between 1 byte and') || msg.includes('size')) {
      msg = `Please upload an image with size less than ${maxMb}MB.`;
    }
    throw new Error(msg);
  }

  const data = await res.json();
  return data.url;
}

/** Best-effort Cloudinary cleanup when an uploaded image is removed/replaced. */
export async function deleteUploadedImage(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    await fetch('/api/uploads/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch {
    // Non-fatal — the DB record is the source of truth.
  }
}
