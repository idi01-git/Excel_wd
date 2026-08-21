import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteImageByUrl } from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ error: 'A valid image URL is required' }, { status: 400 });
    }

    const { ok, result } = await deleteImageByUrl(url.trim());
    if (!ok) {
      return NextResponse.json({ error: `Cloudinary delete failed: ${result}` }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: `Image deleted: ${result}` });
  } catch (error: unknown) {
    console.error('Image deletion API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
