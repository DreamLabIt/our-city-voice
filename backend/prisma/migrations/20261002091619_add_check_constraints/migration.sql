-- Constraints Prisma's schema language cannot express.
--
-- Prisma models map cleanly onto columns, indexes and foreign keys, but it has
-- no syntax for expression indexes or CHECK constraints. Those get written by
-- hand in a migration, which is why this file was created with
-- `prisma migrate dev --create-only` and then edited.
--
-- Prisma will not drift-detect these. They stay until a migration drops them.

-- Case-insensitive email uniqueness.
--
-- The model already has @unique on email, but that is a plain index: it
-- happily stores "Amina@example.com" and "amina@example.com" as two accounts,
-- and then login picks whichever the query happens to match first. The service
-- layer lowercases on write; this makes the database enforce it too.
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (lower("email"));

-- site_contact_info holds the office card on the /contact page. It is a
-- singleton, and this is what keeps it one.
ALTER TABLE "site_contact_info"
  ADD CONSTRAINT "site_contact_info_single_row" CHECK ("id" = 1);
