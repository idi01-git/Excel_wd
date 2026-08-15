// prisma/seed-books-runner.ts
import { PrismaClient } from '@prisma/client';
import { LIBRARY_BOOKS } from './books-data';

const prisma = new PrismaClient();

async function seedLibraryBooks() {
  console.log(`Starting to seed ${LIBRARY_BOOKS.length} books into the Library database with language and genres...`);

  let added = 0;
  let updated = 0;

  for (const book of LIBRARY_BOOKS) {
    const existing = await prisma.book.findFirst({
      where: {
        title: book.title,
        author: book.author,
      },
    });

    if (existing) {
      await prisma.book.update({
        where: { id: existing.id },
        data: {
          description: book.description,
          genre: book.genre,
          language: book.language,
          coverImage: book.coverImage || existing.coverImage,
          pageCount: book.pageCount || existing.pageCount,
          publishedYear: book.publishedYear || existing.publishedYear,
          themeColor: book.themeColor || existing.themeColor,
          editorPickType: book.editorPickType || existing.editorPickType,
          totalCopies: existing.totalCopies || 2,
          availabilityStatus: existing.availabilityStatus || 'AVAILABLE',
        },
      });
      updated++;
    } else {
      await prisma.book.create({
        data: {
          title: book.title,
          author: book.author,
          language: book.language,
          description: book.description,
          genre: book.genre,
          coverImage: book.coverImage,
          pageCount: book.pageCount,
          publishedYear: book.publishedYear,
          themeColor: book.themeColor,
          editorPickType: book.editorPickType,
          totalCopies: 2,
          issuedCopies: 0,
          availabilityStatus: 'AVAILABLE',
        },
      });
      added++;
    }
  }

  console.log(`Successfully processed library books! Added: ${added}, Updated: ${updated}, Total: ${LIBRARY_BOOKS.length}`);
}

seedLibraryBooks()
  .catch((e) => {
    console.error('Error seeding library books:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
