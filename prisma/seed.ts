// prisma/seed.ts
import { PrismaClient, Role, PublicationCategory, PublicationStatus, GalleryItemType, AchievementCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash password
  const passwordHash = await bcrypt.hash('password', 10);

  // 1. Seed Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Sarah Admin',
      email: 'admin@excelsior.club',
      passwordHash,
      role: Role.ADMIN,
      bio: 'Editor-in-Chief & Technical Coordinator of Excelsior. Loves magical realism and system design.',
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
    }
  });

  const moderator = await prisma.user.upsert({
    where: { username: 'moderator' },
    update: {},
    create: {
      username: 'moderator',
      name: 'Mark Moderator',
      email: 'mod@excelsior.club',
      passwordHash,
      role: Role.MODERATOR,
      bio: 'Senior editor, short story enthusiast. Keeping the discussions civil and constructive.',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    }
  });

  const author = await prisma.user.upsert({
    where: { username: 'author' },
    update: {},
    create: {
      username: 'author',
      name: 'John Author',
      email: 'author@excelsior.club',
      passwordHash,
      role: Role.VERIFIED_AUTHOR,
      bio: 'Verified novelist and contributor at Excelsior. Exploring magical realism and sci-fi.',
      profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'
    }
  });

  const member = await prisma.user.upsert({
    where: { username: 'member' },
    update: {},
    create: {
      username: 'member',
      name: 'Jane Member',
      email: 'member@excelsior.club',
      passwordHash,
      role: Role.MEMBER,
      bio: 'Avid reader, aspiring poet, and literature major. Always down for book discussions.',
      profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop'
    }
  });

  console.log('Seeded 4 users: admin, moderator, author, member');

  // 2. Seed some publications
  await prisma.publication.upsert({
    where: { slug: 'silent-architecture-of-memory' },
    update: {},
    create: {
      title: 'The Silent Architecture of Memory',
      slug: 'silent-architecture-of-memory',
      category: PublicationCategory.ARTICLE,
      status: PublicationStatus.PUBLISHED,
      authorId: author.id,
      readingTime: 6,
      tags: ['Memory', 'Philosophy', 'Essays'],
      coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=450&fit=crop',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Memory is not an archive; it is a fluid architecture that gets rebuilt every time we enter its rooms. In this essay, we explore how our personal history is shaped not by what actually happened, but by the narratives we construct in retrospect.' }]
          }
        ]
      },
      publishedAt: new Date()
    }
  });

  console.log('Seeded default publications');

  // 3. Seed Editor's Shelf
  await prisma.editorShelfItem.upsert({
    where: { slug: 'if-on-a-winters-night-a-traveler' },
    update: {},
    create: {
      title: "If on a winter's night a traveler",
      author: 'Italo Calvino',
      slug: 'if-on-a-winters-night-a-traveler',
      genre: ['Postmodernism', 'Fiction', 'Metafiction'],
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=450&fit=crop',
      editorialNote: 'Calvino’s masterpiece is a love letter to the act of reading. Written in the second person, it draws the reader into a nested series of incomplete novels. A mandatory study for any creative writing student at Excelsior.'
    }
  });

  await prisma.editorShelfItem.upsert({
    where: { slug: 'ficciones' },
    update: {},
    create: {
      title: 'Ficciones',
      author: 'Jorge Luis Borges',
      slug: 'ficciones',
      genre: ['Magical Realism', 'Short Stories', 'Philosophy'],
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=450&fit=crop',
      editorialNote: 'Labyrinths, mirrors, infinite libraries, and double agents. Borges is the patron saint of magical realism. This collection of short stories challenges our concept of reality and structure.'
    }
  });

  console.log('Seeded Editor\'s Shelf items');

  // 4. Seed Alumni Profiles
  await prisma.alumniProfile.upsert({
    where: { id: 'alumni-1' },
    update: {},
    create: {
      id: 'alumni-1',
      name: 'Sarah Jenkins',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
      batch: '2018-2022',
      branch: 'Computer Science',
      currentPosition: 'Technical Writer at Google',
      message: 'Excelsior gave me a voice and a family. Never stop writing, even when your code compiles. The bridge between language and logic is where magic happens.'
    }
  });

  await prisma.alumniProfile.upsert({
    where: { id: 'alumni-2' },
    update: {},
    create: {
      id: 'alumni-2',
      name: 'David Kojo',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      batch: '2016-2020',
      branch: 'Electrical Engineering',
      currentPosition: 'Editor at Penguin Random House',
      message: 'Find your cadence. In the club, we learned to critique without crushing. Take that empathy into the publishing industry.'
    }
  });

  console.log('Seeded Alumni Profiles');

  // 5. Seed Gallery Items
  await prisma.galleryItem.createMany({
    data: [
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop',
        caption: 'Excelsior Poetry Slam Night 2025'
      },
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
        caption: 'Alumni Panels & Creative Writing Workshops'
      },
      {
        type: GalleryItemType.PHOTO,
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        caption: 'Editorial Board Planning the Annual Anthology'
      }
    ],
    skipDuplicates: true
  });

  console.log('Seeded Gallery Items');

  // 6. Seed Achievements
  await prisma.achievement.createMany({
    data: [
      {
        title: 'Best College Magazine Award',
        description: 'Awarded 1st place in the National Campus Press Awards for our annual anthology, "Metaphor".',
        category: AchievementCategory.AWARD,
        date: new Date('2025-11-15')
      },
      {
        title: 'Decennial Anniversary Celebration',
        description: 'Celebrated 10 years of preserving stories, Slam Poetry, and building community on campus.',
        category: AchievementCategory.MILESTONE,
        date: new Date('2025-09-10')
      },
      {
        title: 'Inter-University Poetry Slam Champion',
        description: 'Member Jane Member won 1st place at the National Verse Slam Tournament.',
        category: AchievementCategory.COMPETITION,
        date: new Date('2026-02-20')
      }
    ],
    skipDuplicates: true
  });

  console.log('Seeded Achievements');

  // 7. Seed Events & Library
  // Clear any existing to avoid key conflict
  await prisma.issueRequest.deleteMany();
  await prisma.bookReview.deleteMany();
  await prisma.book.deleteMany();
  await prisma.eventWinner.deleteMany();
  await prisma.eventGalleryItem.deleteMany();
  await prisma.eventReport.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();

  // Create Events
  const upcomingEvent = await prisma.event.create({
    data: {
      title: 'Excelsior Poetry Slam 2026',
      slug: 'excelsior-poetry-slam-2026',
      description: 'Prepare your verses! The annual poetry slam tournament is back. This year we have exciting cash prizes and a renowned panel of judges. Open to all students.',
      posterImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&fit=crop',
      date: new Date('2026-08-15T15:00:00.000Z'),
      time: '3:00 PM - 6:00 PM',
      venue: 'Main Auditorium, Campus Hub',
      status: 'UPCOMING',
      isCompetition: true,
      maxCapacity: 100
    }
  });

  const pastEvent = await prisma.event.create({
    data: {
      title: 'Creative Writing Workshop 2026',
      slug: 'creative-writing-workshop-2026',
      description: 'A hands-on session on world-building, narrative arcs, and character development mentored by verified author John Author.',
      posterImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&fit=crop',
      date: new Date('2026-05-10T10:00:00.000Z'),
      time: '10:00 AM - 1:00 PM',
      venue: 'Seminar Hall B, Library Block',
      status: 'PAST',
      isCompetition: false,
      maxCapacity: 50
    }
  });

  // Seed Event Registration
  await prisma.eventRegistration.create({
    data: {
      eventId: pastEvent.id,
      userId: member.id,
      name: 'Jane Member',
      email: 'member@excelsior.club',
      phone: '+91 9876543210',
      extraFields: { dietary: 'None' }
    }
  });

  // Seed Event Report (valid TipTap JSON structure)
  await prisma.eventReport.create({
    data: {
      eventId: pastEvent.id,
      title: 'Workshop Highlights: Building Better Worlds',
      coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&fit=crop',
      authorId: admin.id,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'The Creative Writing Workshop was a massive success! Attended by over 45 students, our verified author John Author walked through modern frameworks of narrative design, offering interactive prompts for character design and world development. Check out the gallery for highlights.'
              }
            ]
          }
        ]
      }
    }
  });

  // Seed Event Gallery
  await prisma.eventGalleryItem.createMany({
    data: [
      {
        eventId: pastEvent.id,
        url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&fit=crop',
        caption: 'Author John Author demonstrating world building maps.',
        type: 'PHOTO',
        uploadedById: admin.id
      }
    ]
  });

  // Seed Books
  const book1 = await prisma.book.create({
    data: {
      title: 'One Hundred Years of Solitude',
      author: 'Gabriel García Márquez',
      description: 'The multi-generational story of the Buendía family, whose patriarch, José Arcadio Buendía, founded the town of Macondo.',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=450&fit=crop',
      genre: ['Fiction', 'Magical Realism'],
      isbn: '9780060883287',
      pageCount: 417,
      publishedYear: 1967,
      totalCopies: 3,
      issuedCopies: 0,
      availabilityStatus: 'AVAILABLE'
    }
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'Ficciones',
      author: 'Jorge Luis Borges',
      description: 'A collection of library labyrinths, philosophical paradoxes, and mystery mirrors.',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=450&fit=crop',
      genre: ['Fiction', 'Philosophy'],
      isbn: '9780871401434',
      pageCount: 174,
      publishedYear: 1944,
      totalCopies: 1,
      issuedCopies: 1,
      availabilityStatus: 'ISSUED'
    }
  });

  // Seed Review
  await prisma.bookReview.create({
    data: {
      bookId: book1.id,
      reviewerId: member.id,
      rating: 5,
      reviewText: 'An absolute masterpiece of magical realism. Macondo lives forever!'
    }
  });

  // Seed Issue Request
  await prisma.issueRequest.create({
    data: {
      bookId: book2.id,
      requesterId: member.id,
      status: 'APPROVED',
      issueDate: new Date(),
      returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days later
    }
  });

  console.log('Seeded Events and Library Data Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
