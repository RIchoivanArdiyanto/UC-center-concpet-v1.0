-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'CENTER_ADMIN');

-- CreateEnum
CREATE TYPE "HeroMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('HOMEPAGE', 'CENTER_DETAIL', 'GENERAL_CONSULTATION');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'CENTER_ADMIN',
    "centerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertiseTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "colorHex" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertiseTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Center" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "logoUrl" TEXT,
    "heroMediaType" "HeroMediaType" NOT NULL DEFAULT 'IMAGE',
    "heroMediaUrl" TEXT,
    "aboutContent" TEXT,
    "profilePdfUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CenterExpertise" (
    "centerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "CenterExpertise_pkey" PRIMARY KEY ("centerId","tagId")
);

-- CreateTable
CREATE TABLE "CenterService" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CenterService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientLogo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "centerId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioProject" (
    "id" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "caseStudyContent" TEXT,
    "coverImageUrl" TEXT,
    "videoEmbedUrl" TEXT,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExpertise" (
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProjectExpertise_pkey" PRIMARY KEY ("projectId","tagId")
);

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "categoryId" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleAttachment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "centerId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "source" "LeadSource" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_centerId_idx" ON "AdminUser"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseTag_name_key" ON "ExpertiseTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseTag_slug_key" ON "ExpertiseTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Center_slug_key" ON "Center"("slug");

-- CreateIndex
CREATE INDEX "Center_isPublished_idx" ON "Center"("isPublished");

-- CreateIndex
CREATE INDEX "CenterService_centerId_idx" ON "CenterService"("centerId");

-- CreateIndex
CREATE INDEX "TeamMember_centerId_idx" ON "TeamMember"("centerId");

-- CreateIndex
CREATE INDEX "ClientLogo_centerId_idx" ON "ClientLogo"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioProject_slug_key" ON "PortfolioProject"("slug");

-- CreateIndex
CREATE INDEX "PortfolioProject_centerId_idx" ON "PortfolioProject"("centerId");

-- CreateIndex
CREATE INDEX "PortfolioProject_isHighlighted_idx" ON "PortfolioProject"("isHighlighted");

-- CreateIndex
CREATE INDEX "PortfolioProject_isPublished_idx" ON "PortfolioProject"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_name_key" ON "ArticleCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "ArticleAttachment_articleId_idx" ON "ArticleAttachment"("articleId");

-- CreateIndex
CREATE INDEX "Lead_centerId_idx" ON "Lead"("centerId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterExpertise" ADD CONSTRAINT "CenterExpertise_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterExpertise" ADD CONSTRAINT "CenterExpertise_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ExpertiseTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CenterService" ADD CONSTRAINT "CenterService_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientLogo" ADD CONSTRAINT "ClientLogo_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioProject" ADD CONSTRAINT "PortfolioProject_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpertise" ADD CONSTRAINT "ProjectExpertise_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PortfolioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExpertise" ADD CONSTRAINT "ProjectExpertise_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ExpertiseTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleAttachment" ADD CONSTRAINT "ArticleAttachment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

