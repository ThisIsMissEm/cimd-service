-- migrate:up
create table clients (
  cid string PRIMARY KEY,
  metadata text NOT NULL,
  createdAt varchar(255) NOT NULL,
  lastUsedAt varchar(255) -- timestamp
);

-- migrate:down
drop table if exists clients;