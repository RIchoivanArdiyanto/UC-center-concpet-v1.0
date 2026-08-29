-- Email anggota tim pakar. Nullable karena tidak semua anggota tim ingin
-- alamatnya dipublikasikan, dan data lama tidak punya nilai ini.
ALTER TABLE "TeamMember" ADD COLUMN "email" TEXT;
