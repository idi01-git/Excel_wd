import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findUnique({
    where: { slug: 'creative-writing-workshop-2026' },
    include: { gallery: true }
  });

  if (!event) {
    console.error('Event not found');
    return;
  }

  const admin = await prisma.user.findFirst({
    where: { role: 'COORDINATOR' }
  });

  const adminId = admin ? admin.id : undefined;

  // Clear existing gallery items for this event
  await prisma.eventGalleryItem.deleteMany({
    where: { eventId: event.id }
  });

  // Diverse resolutions and aspect ratios (tall portrait, wide landscape, square, panorama)
  const photos = [
    {
      url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1000&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=900&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=1400&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1400&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1000&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=950&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1300&auto=format&fit=crop',
      type: 'PHOTO' as const
    },
    {
      url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1100&auto=format&fit=crop',
      type: 'PHOTO' as const
    }
  ];

  for (const p of photos) {
    await prisma.eventGalleryItem.create({
      data: {
        eventId: event.id,
        url: p.url,
        type: p.type,
        uploadedById: adminId
      }
    });
  }

  console.log(`Successfully added ${photos.length} diverse gallery photos to Creative Writing Workshop 2026!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
