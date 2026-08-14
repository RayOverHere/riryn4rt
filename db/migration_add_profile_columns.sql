-- Migration: Add missing columns to artist_profile
-- Run this in Supabase SQL Editor if you haven't migrated yet.
-- These columns are required by the admin profile editor.

alter table artist_profile
  add column if not exists tagline text,
  add column if not exists bio text,
  add column if not exists social_links jsonb default '{}'::jsonb,
  add column if not exists commission_slots_total integer default 10,
  add column if not exists commission_slots_available integer default 5;

-- NOTE: full_bio already exists in schema.sql. The "bio" field in the admin
-- form maps to this new "bio" column (short bio). full_bio is kept for 
-- the public long-form bio. If you want to consolidate, use full_bio everywhere
-- and rename the form field. This migration adds a separate short "bio" column.

-- Backfill: copy short_intro into tagline if empty
update artist_profile set tagline = short_intro where tagline is null and short_intro is not null;
