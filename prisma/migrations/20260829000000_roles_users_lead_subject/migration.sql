-- ===========================================================================
--  Role & permission, username login, dan kolom subjek pada Lead.
--
--  Ditulis manual (bukan hasil `prisma migrate dev`) karena kolom lama
--  "AdminUser"."role" harus di-backfill ke tabel Role dulu sebelum dibuang.
--  Migrasi generate otomatis akan menghapus kolom itu tanpa memindahkan datanya
--  sehingga admin yang sudah ada kehilangan hak aksesnya.
-- ===========================================================================

-- 1. Lingkup akses role -----------------------------------------------------
CREATE TYPE "AdminScope" AS ENUM ('ALL_CENTERS', 'OWN_CENTER');

-- 2. Tabel Role -------------------------------------------------------------
CREATE TABLE "Role" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "scope"       "AdminScope" NOT NULL DEFAULT 'OWN_CENTER',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSystem"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- 3. Dua role bawaan sistem, menggantikan enum AdminRole --------------------
INSERT INTO "Role" ("id", "name", "slug", "description", "scope", "permissions", "isSystem", "updatedAt")
VALUES
  (
    'role_super_admin',
    'Super Admin',
    'super-admin',
    'Akses penuh ke seluruh center dan pengaturan sistem.',
    'ALL_CENTERS',
    ARRAY[
      'dashboard.view',
      'centers.view','centers.manage',
      'portfolio.view','portfolio.manage',
      'articles.view','articles.manage',
      'clients.manage','expertise.manage','homepage.manage',
      'leads.view','leads.manage',
      'activity.view','users.manage','roles.manage'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'role_center_admin',
    'Center Admin',
    'center-admin',
    'Mengelola konten center yang ditugaskan saja.',
    'OWN_CENTER',
    ARRAY[
      'dashboard.view',
      'centers.view','centers.manage',
      'portfolio.view','portfolio.manage',
      'articles.view','articles.manage',
      'leads.view','leads.manage'
    ]::TEXT[],
    true,
    CURRENT_TIMESTAMP
  );

-- 4. Kolom baru pada AdminUser ---------------------------------------------
ALTER TABLE "AdminUser" ADD COLUMN "username" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "roleId"   TEXT;

-- 5. Backfill dari enum lama ke tabel Role ---------------------------------
UPDATE "AdminUser"
SET "roleId" = CASE
    WHEN "role"::TEXT = 'SUPER_ADMIN' THEN 'role_super_admin'
    ELSE 'role_center_admin'
END;

-- Username diturunkan dari bagian lokal email; bentrokan diberi akhiran angka.
UPDATE "AdminUser" AS u
SET "username" = base.candidate
FROM (
    SELECT
        "id",
        CASE WHEN rn = 1 THEN slug ELSE slug || '-' || rn::TEXT END AS candidate
    FROM (
        SELECT
            "id",
            slug,
            ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "createdAt", "id") AS rn
        FROM (
            SELECT
                "id",
                "createdAt",
                COALESCE(
                    NULLIF(regexp_replace(lower(split_part("email", '@', 1)), '[^a-z0-9]+', '', 'g'), ''),
                    'user'
                ) AS slug
            FROM "AdminUser"
        ) AS normalized
    ) AS ranked
) AS base
WHERE u."id" = base."id";

-- 6. Kunci constraint setelah data terisi ----------------------------------
ALTER TABLE "AdminUser" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "AdminUser" ALTER COLUMN "roleId"   SET NOT NULL;

CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
CREATE INDEX "AdminUser_roleId_idx" ON "AdminUser"("roleId");

ALTER TABLE "AdminUser"
    ADD CONSTRAINT "AdminUser_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. Buang enum lama --------------------------------------------------------
ALTER TABLE "AdminUser" DROP COLUMN "role";
DROP TYPE "AdminRole";

-- 8. Subjek pesan dari form Kontak -----------------------------------------
ALTER TABLE "Lead" ADD COLUMN "subject" TEXT;
