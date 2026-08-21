// scripts/migrate-roles.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting safe PostgreSQL Role enum migration...');

  // 1. Add new enum values
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
    } catch (e: any) {
      console.log(`Note for ${r}:`, e.message);
    }
  }

  // 2. Migrate existing user rows
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "role" = 'COORDINATOR' WHERE "role"::text = 'ADMIN'`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "role" = 'TECH_LEAD' WHERE "role"::text = 'MODERATOR'`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "role" = 'MEMBER' WHERE "role"::text IN ('VERIFIED_AUTHOR', 'MEMBER')`
    );
    console.log('Migrated existing User rows to new roles.');
  } catch (e: any) {
    console.log('Row migration notice:', e.message);
  }

  // 3. Swap to fresh enum
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TYPE "Role_new" AS ENUM ('COORDINATOR','TECH_LEAD','PR_HEAD','OPERATIONS_HEAD','TREASURER','MEMBER','ALUMNI','VISITOR')`
    );
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
  } catch (e: any) {
    console.log('Enum swap notice:', e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
