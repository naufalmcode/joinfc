-- AlterTable
ALTER TABLE "event_registrations" ADD COLUMN     "position" TEXT NOT NULL DEFAULT 'player';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "locationUrl" TEXT,
ADD COLUMN     "maxGoalkeepers" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "heroType" TEXT NOT NULL DEFAULT 'gradient',
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "whatsappUrl" TEXT;

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);
