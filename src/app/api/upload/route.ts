import { NextResponse } from 'next/server';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { requirePermission } from '@/lib/api-auth';
import type { Permission } from '@/lib/rbac';

// Per-folder size limits (bytes)
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB for general images
const PROOF_MAX_BYTES   = 10 * 1024 * 1024;  // 10 MB for payment proofs

// Allowed MIME types for general image folders
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// Allowed MIME types for payment proof folder (images + PDF)
const ALLOWED_PROOF_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const FOLDER_PERMISSIONS: Record<string, Permission> = {
  'alumni-photos': 'MANAGE_ALUMNI',
  'members-directory': 'MANAGE_MEMBERS',
  'library-covers': 'MANAGE_SHELF_LIBRARY',
  gallery: 'MANAGE_GALLERY',
  'event-posters': 'MANAGE_EVENTS',
  'event-media': 'MANAGE_EVENTS',
  'event-qr': 'MANAGE_EVENTS',
  // Signed-in attendees can submit a proof, but cannot alter event artwork.
  'event-payment-proofs': 'INTERACT',
  'shelf-covers': 'MANAGE_SHELF_LIBRARY',
  achievements: 'MANAGE_ACHIEVEMENTS',
  'homepage-cards': 'MANAGE_HOMEPAGE_CMS',
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (typeof folder !== 'string' || (folder !== 'avatars' && !FOLDER_PERMISSIONS[folder])) {
      return NextResponse.json({ error: 'Unsupported upload folder' }, { status: 403 });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary server credentials are not configured' }, { status: 500 });
    }

    if (folder !== 'avatars') {
      const { error } = await requirePermission(FOLDER_PERMISSIONS[folder]);
      if (error) return error;
    }

    const isProofFolder = folder === 'event-payment-proofs';
    const allowedTypes = isProofFolder ? ALLOWED_PROOF_TYPES : ALLOWED_IMAGE_TYPES;
    const maxBytes     = isProofFolder ? PROOF_MAX_BYTES : DEFAULT_MAX_BYTES;

    if (!allowedTypes.has(file.type)) {
      const allowed = isProofFolder
        ? 'JPEG, PNG, WebP, GIF images or PDF'
        : 'JPEG, PNG, or WebP images';
      return NextResponse.json(
        { error: `Only ${allowed} are allowed` },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > maxBytes) {
      const limitMb = maxBytes / (1024 * 1024);
      return NextResponse.json(
        { error: `File must be between 1 byte and ${limitMb}MB` },
        { status: 400 }
      );
    }

    const isPdf = file.type === 'application/pdf';
    const buffer = Buffer.from(await file.arrayBuffer());

    // Folder-specific dimension bounding
    let maxDim = 2400;
    if (folder === 'avatars' || folder === 'members-directory' || folder === 'alumni-photos') {
      maxDim = 800;
    } else if (folder === 'library-covers' || folder === 'shelf-covers') {
      maxDim = 1400;
    } else if (folder === 'event-qr') {
      maxDim = 1000;
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `excelsior/${folder}`,
          resource_type: isPdf ? 'auto' : 'image',
          overwrite: false,
          transformation: isPdf
            ? undefined
            : [
                { quality: 'auto' },
                { fetch_format: 'auto' },
                { width: maxDim, height: maxDim, crop: 'limit' },
              ],
        },
        (uploadError, response) =>
          uploadError || !response
            ? reject(uploadError ?? new Error('Cloudinary did not return an upload result'))
            : resolve(response)
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      width: result.width,
      height: result.height,
    });
  } catch (error: unknown) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}