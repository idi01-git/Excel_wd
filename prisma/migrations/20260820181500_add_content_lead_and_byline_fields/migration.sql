-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CONTENT_LEAD';

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "directoryPhoto" TEXT,
ADD COLUMN IF NOT EXISTS "showSocialLinks" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Publication" ADD COLUMN IF NOT EXISTS "authorName" TEXT,
ADD COLUMN IF NOT EXISTS "authorNote" TEXT,
ADD COLUMN IF NOT EXISTS "alumniProfileId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Publication_alumniProfileId_idx" ON "Publication"("alumniProfileId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Publication_alumniProfileId_fkey'
    ) THEN
        ALTER TABLE "Publication" ADD CONSTRAINT "Publication_alumniProfileId_fkey" FOREIGN KEY ("alumniProfileId") REFERENCES "AlumniProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
