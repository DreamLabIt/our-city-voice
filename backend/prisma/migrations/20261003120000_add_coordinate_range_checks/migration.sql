-- Bounds for the coordinate columns.
--
-- latitude and longitude are plain DECIMAL(9,6), so the database will happily
-- store a transposed pair or the 0,0 that a null turns into once something
-- coerces it to a number. Both render as a marker somewhere surprising, and
-- the only symptom is a pin in the wrong ocean, which is miserable to debug
-- from a screenshot. Cheaper to reject the write.
--
-- Prisma has no syntax for CHECK constraints, so this is hand-written, same
-- as 20261002091619_add_check_constraints. Prisma will not drift-detect it.

ALTER TABLE "posts"
  ADD CONSTRAINT "posts_latitude_range" CHECK ("latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "posts_longitude_range" CHECK ("longitude" BETWEEN -180 AND 180);

ALTER TABLE "site_contact_info"
  ADD CONSTRAINT "site_contact_info_latitude_range" CHECK ("latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "site_contact_info_longitude_range" CHECK ("longitude" BETWEEN -180 AND 180);
