-- SPRAXXX schema (initial migration)
-- Users table: address is primary key, created_at stored as integer epoch seconds
create table if not exists users (
  address text primary key,
  created_at integer not null
);

-- Pending OTPs: store per-request OTPs with backup email and expiry as integer epoch seconds
create table if not exists pending (
  id integer primary key autoincrement,
  address text not null,
  backup text not null,
  code text not null,
  created_at integer not null,
  expires_at integer not null
);

-- Ensure we don't have duplicate pending rows for the same address+code
create unique index if not exists idx_pending_address_code on pending(address, code);

-- Index to support rate-limit queries by backup email and recent creation time
create index if not exists idx_pending_backup_created_at on pending(backup, created_at);

-- Index to quickly find expired or non-expired rows
create index if not exists idx_pending_expires_at on pending(expires_at);