// src/lib/upload.ts

export async function uploadImageBlob(
  blob: Blob,
  folder = 'avatars',
  filename = 'upload.jpg'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload image');
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
