// scripts/migrate-roles.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting safe PostgreSQL Role enum migration...');

  const newRoles = [
    'COORDINATOR',
    'TECH_LEAD',
    'PR_HEAD',
    'OPERATIONS_HEAD',
    'TREASURER',
    'ALUMNI',
    'VISITOR',
  ];

  for (const r of newRoles) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "Role" ADD VALUE IF NOT EXISTS '${r}'`
      );
      console.log(`Added enum value: ${r}`);
    } catch (e) {
      console.log(`Note for ${r}:`, e.message);
    }
  }

  // 2. Migrate existing user rows
  try {
    const resAdmin = await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "role" = 'COORDINATOR' WHERE "role"::text = 'ADMIN'`
    );
    const resMod = await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "role" = 'TECH_LEAD' WHERE "role"::text = 'MODERATOR'`
    );
    const resMem = await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "role" = 'MEMBER' WHERE "role"::text IN ('VERIFIED_AUTHOR', 'MEMBER')`
    );
    console.log('Migrated existing User rows to new roles.');
  } catch (e) {
    console.log('Row migration notice:', e.message);
  }

  // 3. Swap to fresh enum
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TYPE "Role_new" AS ENUM ('COORDINATOR','TECH_LEAD','PR_HEAD','OPERATIONS_HEAD','TREASURER','MEMBER','ALUMNI','VISITOR')`
    );
    console.log('Created Role_new type.');
  } catch (e) {
    console.log('Role_new creation note:', e.message);
  }

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new")`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VISITOR'`
    );
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "Role"`);
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role_new" RENAME TO "Role"`);
    console.log('Successfully swapped Role enum to clean new version!');
  } catch (e) {
    console.log('Enum swap note:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
