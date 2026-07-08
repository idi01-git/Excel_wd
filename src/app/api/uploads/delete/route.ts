import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v2 as cloudinary } from 'cloudinary';
import { authOptions } from '@/lib/auth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to extract public ID from Cloudinary URL
function getPublicIdFromUrl(url: string): string | null {
  try {
    if (!url.includes('cloudinary.com')) return null;
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return null;
    // Extract path after /image/upload/, e.g., v1234567/folder/image_id.png or folder/image_id.png
    const path = parts[1].replace(/^v\d+\//, ''); // remove version if present (e.g. v171239847/)
    const dotIndex = path.lastIndexOf('.');
    if (dotIndex === -1) return path;
    return path.substring(0, dotIndex); // remove extension
  } catch (error) {
    console.error('Error parsing publicId from URL:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary credentials are not configured' }, { status: 500 });
    }

    const { url } = await req.json();
    if (typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'A valid image URL is required' }, { status: 400 });
    }

    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      // If it's not a Cloudinary URL, we just return success: true (no-op)
      return NextResponse.json({ success: true, message: 'Not a Cloudinary image, skipped deletion' });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok' || result.result === 'not found') {
      return NextResponse.json({ success: true, message: `Image deleted: ${result.result}` });
    } else {
      return NextResponse.json({ error: `Cloudinary delete failed: ${result.result}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Image deletion API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
