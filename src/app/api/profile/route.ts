import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { validateUsername } from '@/lib/registration';

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

    const {
      name,
      username,
      bio,
      profilePhoto,
      socialLinks,
      showSocialLinks,
      currentPosition,
      excelsiorPosition,
      alumniMessage,
    } = await req.json();

    // Field Validations
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Username format check
    const usernameValidation = validateUsername(cleanUsername);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error || 'Invalid username format' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { id: (session.user as any).id },
      select: { profilePhoto: true, username: true },
    });

    // Check if username is taken by someone else
    if (cleanUsername !== session.user.username?.toLowerCase()) {
      const usernameOccupied = await db.user.findUnique({
        where: { username: cleanUsername },
      });
      if (usernameOccupied && usernameOccupied.id !== (session.user as any).id) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    let profilePhotoUrl = profilePhoto;

    // Handle Cloudinary upload if a base64 string is sent
    if (profilePhoto && profilePhoto.startsWith('data:image/')) {
      // Validate file size (under 10MB)
      const base64Length = profilePhoto.length - (profilePhoto.indexOf(',') + 1);
      const sizeInBytes = (base64Length * 3) / 4;
      if (sizeInBytes > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Profile photo must be under 10MB' }, { status: 400 });
      }

      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return NextResponse.json({ error: 'Cloudinary server credentials are not configured' }, { status: 500 });
      }

      try {
        const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
          folder: 'excelsior/avatars',
          public_id: `profile-${session.user.id}`,
          overwrite: true,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        });
        profilePhotoUrl = uploadResponse.secure_url;
      } catch (cloudinaryError: unknown) {
        console.error('Cloudinary upload failure:', cloudinaryError);
        const msg = cloudinaryError instanceof Error ? cloudinaryError.message : 'Photo upload failed';
        return NextResponse.json({ error: `Failed to upload avatar to Cloudinary: ${msg}` }, { status: 500 });
      }
    } else if (profilePhotoUrl === null || profilePhotoUrl === '') {
      // If user deliberately removed their avatar, delete the existing one from Cloudinary
      if (existingUser?.profilePhoto) {
        const { deleteImageByUrl } = await import('@/lib/cloudinary');
        await deleteImageByUrl(existingUser.profilePhoto);
      }
    }

    // Update user in DB
    const updatedUser = await db.user.update({
      where: { id: (session.user as any).id },
      data: {
        name: name.trim(),
        username: cleanUsername,
        bio: bio ? bio.trim() : null,
        profilePhoto: profilePhotoUrl,
        socialLinks: socialLinks !== undefined ? socialLinks : undefined,
        showSocialLinks: showSocialLinks !== undefined ? Boolean(showSocialLinks) : undefined,
      },
    });

    // If alumnus, sync extra alumni details
    if (updatedUser.role === 'ALUMNI') {
      await db.alumniProfile.upsert({
        where: { userId: updatedUser.id },
        update: {
          name: updatedUser.name,
          currentPosition:
            currentPosition !== undefined
              ? currentPosition
                ? String(currentPosition).trim()
                : null
              : undefined,
          excelsiorPosition:
            excelsiorPosition !== undefined
              ? excelsiorPosition
                ? String(excelsiorPosition).trim()
                : null
              : undefined,
          message:
            alumniMessage !== undefined
              ? alumniMessage
                ? String(alumniMessage).trim()
                : null
              : undefined,
        },
        create: {
          userId: updatedUser.id,
          name: updatedUser.name,
          branch: updatedUser.branch || 'CSE',
          batch: updatedUser.batch || String(new Date().getFullYear()),
          photo: updatedUser.directoryPhoto || updatedUser.profilePhoto,
          currentPosition: currentPosition ? String(currentPosition).trim() : null,
          excelsiorPosition: excelsiorPosition ? String(excelsiorPosition).trim() : 'Alumnus',
          message: alumniMessage ? String(alumniMessage).trim() : null,
          email: updatedUser.email,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        profilePhoto: updatedUser.profilePhoto,
        socialLinks: updatedUser.socialLinks,
        showSocialLinks: updatedUser.showSocialLinks,
      },
    });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
