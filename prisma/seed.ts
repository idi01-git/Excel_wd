// prisma/seed.ts
import { PrismaClient, Role, PublicationCategory, PublicationStatus, GalleryItemType, AchievementCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { LIBRARY_BOOKS } from './books-data';

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

  // 2. Seed Publications (varying categories and statuses)
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

  await prisma.publication.upsert({
    where: { slug: 'echoes-of-the-monsoon' },
    update: {},
    create: {
      title: 'Echoes of the Monsoon',
      slug: 'echoes-of-the-monsoon',
      category: PublicationCategory.POEM,
      status: PublicationStatus.PUBLISHED,
      authorId: member.id,
      readingTime: 2,
      tags: ['Nature', 'Nostalgia', 'Poetry'],
      coverImage: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&h=450&fit=crop',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'The sky bruised purple, weeping ink upon the parched clay. We danced in the downpour, writing poems on dry leaves, washing away the seasons of waiting.' }]
          }
        ]
      },
      publishedAt: new Date()
    }
  });

  await prisma.publication.upsert({
    where: { slug: 'neon-dreamers' },
    update: {},
    create: {
      title: 'Neon Dreamers',
      slug: 'neon-dreamers',
      category: PublicationCategory.STORY,
      status: PublicationStatus.PENDING,
      authorId: author.id,
      readingTime: 12,
      tags: ['Sci-Fi', 'Cyberpunk', 'Short Story'],
      coverImage: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800&h=450&fit=crop',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Under the holographic rain, Kael interface-jacked the core network. He could feel the pulse of a million minds, locked inside the grid, dreaming of synthetic green pastures.' }]
          }
        ]
      }
    }
  });

  console.log('Seeded publications (Published & Pending)');

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

  // 4. Seed Alumni Profiles (Seeding 15 profiles to test pagination threshold of 12!)
  const alumniProfilesData = [
    {
      id: 'alumni-1',
      name: 'Sarah Jenkins',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
      batch: '2018-2022',
      branch: 'Computer Science',
      currentPosition: 'Technical Writer at Google',
      excelsiorPosition: 'Editor-in-Chief',
      message: 'Excelsior gave me a voice and a family. Never stop writing, even when your code compiles. The bridge between language and logic is where magic happens.',
      email: 'sarah.j@google.com',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 'alumni-2',
      name: 'David Kojo',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      batch: '2016-2020',
      branch: 'Electrical Engineering',
      currentPosition: 'Editor at Penguin Random House',
      excelsiorPosition: 'Senior Reviewer',
      message: 'Find your cadence. In the club, we learned to critique without crushing. Take that empathy into the publishing industry.',
      email: 'kojo.david@penguin.com',
      instagram: 'https://instagram.com'
    },
    {
      id: 'alumni-3',
      name: 'Priya Sharma',
      photo: 'https://images.unsplash.com/photo-1534751516642-a131ffd107fd?w=200&h=200&fit=crop',
      batch: '2019-2023',
      branch: 'Information Technology',
      currentPosition: 'Frontend Engineer at Vercel',
      excelsiorPosition: 'Design Lead',
      message: 'Excelsior is where my love for typography and layouts began. Making magazines look editorial was the sandbox for what I do now.',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 'alumni-4',
      name: 'Marcus Vance',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
      batch: '2015-2019',
      branch: 'Mechanical Engineering',
      currentPosition: 'Automotive Journalist at TopGear',
      excelsiorPosition: 'Core Member',
      message: 'I was an engineer who loved engines and poetry. Excelsior taught me that storytelling belongs everywhere, even under a car chassis.',
      email: 'marcus.vance@topgear.com'
    },
    {
      id: 'alumni-5',
      name: 'Elena Rostova',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
      batch: '2017-2021',
      branch: 'Civil Engineering',
      currentPosition: 'Architectural Consultant',
      excelsiorPosition: 'PR Lead',
      message: 'Structure, space, and syntax. Whether laying brick or writing copy, proportions matter. Excelsior set that foundation for me.',
      instagram: 'https://instagram.com'
    },
    {
      id: 'alumni-6',
      name: 'Alex Chen',
      photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
      batch: '2020-2024',
      branch: 'Computer Science',
      currentPosition: 'AI Researcher at OpenAI',
      excelsiorPosition: 'Web Coordinator',
      message: 'Large language models process text, but human language holds the soul. Keep the poetry alive in the machine age.',
      linkedin: 'https://linkedin.com',
      email: 'alex.chen@openai.com'
    },
    {
      id: 'alumni-7',
      name: 'Fatima Al-Sayed',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
      batch: '2018-2022',
      branch: 'Chemical Engineering',
      currentPosition: 'Technical Consultant at McKinsey',
      excelsiorPosition: 'Treasurer',
      message: 'Formulas tell part of the truth, stories tell the rest. Balancing spreadsheets and editing anthologies was a wild but necessary ride.',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 'alumni-8',
      name: 'Kenji Takahashi',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop',
      batch: '2016-2020',
      branch: 'Electronics & Communication',
      currentPosition: 'Hardware Designer at Sony',
      excelsiorPosition: 'Slam Coordinator',
      message: 'We measured wavelengths in lab and vocal resonance at slam nights. They’re just different frequencies of the same human expression.',
      instagram: 'https://instagram.com'
    },
    {
      id: 'alumni-9',
      name: 'Sophie Dubois',
      photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop',
      batch: '2019-2023',
      branch: 'Computer Science',
      currentPosition: 'Product Manager at Figma',
      excelsiorPosition: 'Editorial Board',
      message: 'Figma boards and magazine drafts aren’t that different. It’s all about collaboration, iterations, and pushing constraints.',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 'alumni-10',
      name: 'Carlos Mendez',
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop',
      batch: '2015-2019',
      branch: 'Mechanical Engineering',
      currentPosition: 'Creative Director at Vogue',
      excelsiorPosition: 'Art Director',
      message: 'An engineer finding a home at Vogue makes total sense if you knew the grid systems we obsessed over at Excelsior.',
      instagram: 'https://instagram.com'
    },
    {
      id: 'alumni-11',
      name: 'Amara Okafor',
      photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
      batch: '2017-2021',
      branch: 'Information Technology',
      currentPosition: 'Cybersecurity Analyst at Crowdstrike',
      excelsiorPosition: 'Moderator',
      message: 'Spotting syntax errors in code prepares you well for editing comma splices. Protect your system, protect your style.',
      email: 'amara.o@crowdstrike.com'
    },
    {
      id: 'alumni-12',
      name: 'Liam O\'Connor',
      photo: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=200&h=200&fit=crop',
      batch: '2020-2024',
      branch: 'Computer Science',
      currentPosition: 'Graduate Assistant at Stanford',
      excelsiorPosition: 'Poetry Mentor',
      message: 'Academic papers are precise, poetry is expansive. You need both to avoid getting intellectually claustrophobic.',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 'alumni-13',
      name: 'Zara Patel',
      photo: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=200&h=200&fit=crop',
      batch: '2018-2022',
      branch: 'Civil Engineering',
      currentPosition: 'Structural Engineer',
      excelsiorPosition: 'Anthology Editor',
      message: 'Magazines require structural integrity, too. A weak spine ruins a book just like a bridge.',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com'
    },
    {
      id: 'alumni-14',
      name: 'Nikita Smirnov',
      photo: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=200&h=200&fit=crop',
      batch: '2016-2020',
      branch: 'Electrical Engineering',
      currentPosition: 'Sound Designer at Ubisoft',
      excelsiorPosition: 'Audio Coordinator',
      message: 'Designing sonic spaces for open-world games started with mixing audio for our podcasts and slam stages.',
      email: 'nikita.smir@ubisoft.com'
    },
    {
      id: 'alumni-15',
      name: 'Chloe Lefevre',
      photo: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=200&h=200&fit=crop',
      batch: '2019-2023',
      branch: 'Chemical Engineering',
      currentPosition: 'Fragrance Chemist at Estée Lauder',
      excelsiorPosition: 'Anthology Contributor',
      message: 'Blending volatile chemicals to create perfumes is a lot like blending words to evoke memory.',
      instagram: 'https://instagram.com'
    }
  ];

  for (const alum of alumniProfilesData) {
    await prisma.alumniProfile.upsert({
      where: { id: alum.id },
      update: {},
      create: alum
    });
  }

  console.log('Seeded 15 Alumni Profiles (to test pagination)');

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
      posterImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&h=800&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1600&h=900&fit=crop',
      date: new Date('2026-08-15T15:00:00.000Z'),
      time: '3:00 PM - 6:00 PM',
      venue: 'Main Auditorium, Campus Hub',
      status: 'UPCOMING',
      isCompetition: true,
      maxCapacity: 100,
      rulebookUrl: 'https://excelsior.club/docs/poetry-slam-2026-rules.pdf',
      socialLink: 'https://instagram.com/excelsior_club',
      downloadUrl: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=1200&fit=crop'
    }
  });

  const pastEvent = await prisma.event.create({
    data: {
      title: 'Creative Writing Workshop 2026',
      slug: 'creative-writing-workshop-2026',
      description: 'A hands-on session on world-building, narrative arcs, and character development mentored by verified author John Author.',
      posterImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=800&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&h=900&fit=crop',
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

  // Seed All 60 Library Books (30 Hindi + 30 English)
  const createdBooks = [];
  for (const book of LIBRARY_BOOKS) {
    const created = await prisma.book.create({
      data: {
        title: book.title,
        author: book.author,
        language: book.language,
        description: book.description,
        genre: book.genre,
        coverImage: book.coverImage,
        pageCount: book.pageCount,
        publishedYear: book.publishedYear,
        isbn: book.isbn,
        themeColor: book.themeColor,
        editorPickType: book.editorPickType,
        totalCopies: 2,
        issuedCopies: 0,
        availabilityStatus: 'AVAILABLE',
      }
    });
    createdBooks.push(created);
  }

  // Seed sample reviews & issue requests on seeded books
  if (createdBooks.length >= 2) {
    await prisma.bookReview.create({
      data: {
        bookId: createdBooks[0].id,
        reviewerId: member.id,
        rating: 5,
        reviewText: 'An absolute masterpiece. Deeply moving and timeless!'
      }
    });

    await prisma.issueRequest.create({
      data: {
        bookId: createdBooks[1].id,
        requesterId: member.id,
        status: 'APPROVED',
        issueDate: new Date(),
        returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });
  }

  console.log(`Seeded ${createdBooks.length} Library Books, Events, and sample reviews successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
