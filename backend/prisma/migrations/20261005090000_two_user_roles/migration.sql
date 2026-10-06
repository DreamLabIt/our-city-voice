-- Collapse user_role to two values, and store an avatar URL instead of a key.
--
-- Written by hand rather than generated. `prisma migrate dev` would have
-- produced a destructive plan here: its default for a removed enum value is to
-- drop and recreate the type, which means dropping the column that uses it and
-- losing every existing role. The USING clause below converts instead.

-- ── user_role: citizen | officer | admin  ->  user | super_admin ──
--
-- Postgres cannot remove a value from an enum in place, so the type is
-- replaced. Renaming the old type first means both exist for the length of the
-- transaction and the column can be cast across.
ALTER TYPE "user_role" RENAME TO "user_role_old";

CREATE TYPE "user_role" AS ENUM ('user', 'super_admin');

-- The default references the old type, so it has to go before the cast and
-- come back after. Postgres refuses the ALTER COLUMN TYPE otherwise.
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- Only 'admin' carried real privileges, so only it maps to super_admin.
-- officer and citizen had identical permissions and both become 'user'.
-- The ::text cast is what lets the CASE compare against a plain literal
-- without resolving it as a value of either enum type.
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "user_role"
  USING (
    CASE WHEN "role"::text = 'admin' THEN 'super_admin' ELSE 'user' END
  )::"user_role";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

DROP TYPE "user_role_old";

-- ── avatars ──
--
-- RENAME, not drop-and-add: uploads are done by the time a row is written, so
-- the column may already hold URLs we would rather not throw away.
ALTER TABLE "users" RENAME COLUMN "avatar_key" TO "avatar_url";
