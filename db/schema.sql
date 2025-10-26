CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE clients (
  cid string PRIMARY KEY,
  metadata text NOT NULL,
  createdAt varchar(255) NOT NULL,
  lastUsedAt varchar(255) -- timestamp
);
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20251025190306');
