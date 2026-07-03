import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, username, bio, profilePhoto } = await req.json();

    // Field Validations
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Username regex check (letters, numbers, underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Check if username is taken by someone else
    if (cleanUsername !== session.user.username?.toLowerCase()) {
      const existingUser = await db.user.findUnique({
        where: { username: cleanUsername },
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    let profilePhotoUrl = profilePhoto;

    // Handle Cloudinary upload if a base64 string is sent
    if (profilePhoto && profilePhoto.startsWith('data:image/')) {
      // Validate file size (under 500KB)
      const base64Length = profilePhoto.length - (profilePhoto.indexOf(',') + 1);
      const sizeInBytes = (base64Length * 3) / 4;
      if (sizeInBytes > 500 * 1024) {
        return NextResponse.json({ error: 'Profile photo must be under 500KB' }, { status: 400 });
      }

      // Check if credentials are set
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return NextResponse.json({ error: 'Cloudinary credentials are not configured on server' }, { status: 500 });
      }

      try {
        const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
          folder: 'excelsior/avatars',
          public_id: `profile-${session.user.id}`,
          overwrite: true,
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        });
        profilePhotoUrl = uploadResponse.secure_url;
      } catch (cloudinaryError: any) {
        console.error('Cloudinary upload failure:', cloudinaryError);
        return NextResponse.json({ error: 'Cloudinary upload failed: ' + (cloudinaryError.message || 'Unknown error') }, { status: 500 });
      }
    }

    // Update user in DB
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        username: cleanUsername,
        bio: bio ? bio.trim() : null,
        profilePhoto: profilePhotoUrl,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        profilePhoto: updatedUser.profilePhoto,
      },
    });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
