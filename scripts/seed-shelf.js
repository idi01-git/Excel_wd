const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Shelf Data...');

  // 1. Migrate old EditorShelfItem to Book if they don't exist
  const oldItems = await prisma.editorShelfItem.findMany();
  for (const item of oldItems) {
    // Check if a book with same title exists
    const existing = await prisma.book.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.book.create({
        data: {
          title: item.title,
          author: item.author,
          coverImage: item.coverImage,
          description: item.editorialNote || 'No description provided.',
          clubReview: item.editorialNote,
          genre: item.genre,
          editorPickType: 'ARCHIVE',
          themeColor: '#4f46e5'
        }
      });
      console.log(`Migrated: ${item.title}`);
    }
  }

  // 2. Add some premium Seed Data for Week, Month, Magazine
  const seedBooks = [
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
      description: "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
      clubReview: "A masterful exploration of regret and hope. Haig captures the human condition beautifully in this imaginative narrative.",
      genre: ["Fiction", "Fantasy"],
      editorPickType: "WEEK",
      themeColor: "#3b82f6", // blue
      amazonLink: "https://amazon.com",
      downloadLink: "https://example.com"
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      coverImage: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop",
      description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the 'spice' melange.",
      clubReview: "The greatest science fiction novel ever written. Its world-building is unparalleled and remains highly relevant today.",
      genre: ["Sci-Fi", "Classic"],
      editorPickType: "MONTH",
      themeColor: "#d97706", // amber
      amazonLink: "https://amazon.com",
      downloadLink: "https://example.com"
    },
    {
      title: "Excelsior Issue #1",
      author: "Editorial Board",
      coverImage: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?q=80&w=800&auto=format&fit=crop",
      description: "Our inaugural issue featuring poetry, short stories, and critical essays from the best emerging voices on campus.",
      clubReview: "A stunning collection of raw talent. A must-read for anyone interested in contemporary student literature.",
      genre: ["Magazine", "Anthology"],
      editorPickType: "MAGAZINE",
      themeColor: "#10b981", // emerald
      amazonLink: "https://amazon.com",
      downloadLink: "https://example.com"
    }
  ];

  for (const seed of seedBooks) {
    const existing = await prisma.book.findFirst({ where: { title: seed.title } });
    if (!existing) {
      await prisma.book.create({ data: seed });
      console.log(`Seeded: ${seed.title}`);
    } else {
      // update it to ensure it has the correct pick type
      await prisma.book.update({
        where: { id: existing.id },
        data: seed
      });
      console.log(`Updated Seed: ${seed.title}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
