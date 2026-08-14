-- Supabase PostgreSQL Database Schema
-- Digital Artist Portfolio & Commission Platform

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clean up existing tables if any (ordered by dependency)
drop table if exists site_settings;
drop table if exists faqs;
drop table if exists testimonials;
drop table if exists commission_requests;
drop table if exists price_overrides;
drop table if exists commission_types;
drop table if exists countries;
drop table if exists pricing_regions;
drop table if exists artworks;
drop table if exists artwork_categories;
drop table if exists social_links;
drop table if exists artist_profile;

-- 1. artist_profile
create table artist_profile (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    display_name text not null,
    profile_image_url text,
    short_intro text,
    full_bio text,
    tagline text,
    bio text,
    location text,
    commission_availability boolean default true,
    commission_slots_total integer default 10,
    commission_slots_available integer default 5,
    social_links jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. social_links
create table social_links (
    id uuid primary key default uuid_generate_v4(),
    platform text not null, -- 'instagram', 'twitter', 'bluesky', 'tiktok', etc.
    url text not null,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. artwork_categories
create table artwork_categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. artworks
create table artworks (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    category_id uuid references artwork_categories(id) on delete set null,
    image_url text not null,
    display_order integer default 0,
    is_featured boolean default false,
    is_hidden boolean default false,
    is_published boolean default true,
    tags text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. pricing_regions
create table pricing_regions (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique, -- e.g., 'Indonesia', 'North America', 'Southeast Asia', 'Europe', 'Default International'
    currency_code text not null default 'USD', -- e.g., 'IDR', 'USD', 'EUR', 'SGD'
    regional_multiplier numeric(10,2) not null default 1.00,
    exchange_rate numeric(15,6) not null default 1.000000, -- Exchange rate relative to base (IDR value of 1 unit of foreign currency. E.g. if 1 USD = 15,000 IDR, exchange_rate = 15,000)
    last_exchange_rate_update timestamp with time zone default timezone('utc'::text, now()) not null,
    rounding_method text not null default 'nearest_5', -- 'nearest_5', 'nearest_10', 'nearest_10000', 'none'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. countries
create table countries (
    code text primary key, -- 2-letter ISO country code (e.g. 'ID', 'US', 'MY')
    name text not null,
    pricing_region_id uuid references pricing_regions(id) on delete restrict not null,
    phone_prefix text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. commission_types
create table commission_types (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    description text,
    base_price_idr numeric(15,2) not null, -- Always input the base price in IDR
    turnaround_time text, -- e.g. '2-3 weeks'
    revision_policy text, -- e.g. '2 sketch revisions, 1 color revision'
    commercial_usage_policy text, -- e.g. 'Personal use only. Commercial is +50%'
    is_active boolean default true,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. price_overrides
create table price_overrides (
    id uuid primary key default uuid_generate_v4(),
    commission_type_id uuid references commission_types(id) on delete cascade not null,
    pricing_region_id uuid references pricing_regions(id) on delete cascade not null,
    override_price numeric(15,2) not null, -- Explicit price in target region's currency
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (commission_type_id, pricing_region_id)
);

-- 9. commission_requests
create table commission_requests (
    id uuid primary key default uuid_generate_v4(),
    client_name text not null,
    client_email text not null,
    client_country_code text references countries(code) on delete restrict not null,
    client_phone text not null,
    preferred_contact_method text not null, -- 'email', 'discord', 'instagram'
    commission_type_id uuid references commission_types(id) on delete restrict not null,
    character_count integer not null default 1,
    description text not null,
    reference_images text[] not null default '{}', -- array of public storage URLs
    desired_deadline date,
    is_commercial boolean not null default false,
    additional_notes text,
    status text not null default 'new', -- 'new', 'reviewing', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'
    internal_notes text,
    quoted_price numeric(15,2) not null, -- Final price charged
    currency text not null, -- Currency used for the quote (e.g. 'USD', 'IDR')
    pricing_version text default '1.0',
    exchange_rate_used numeric(15,6),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. testimonials
create table testimonials (
    id uuid primary key default uuid_generate_v4(),
    client_name text not null,
    feedback text not null,
    commission_type_id uuid references commission_types(id) on delete set null,
    avatar_url text,
    display_order integer default 0,
    is_visible boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. faqs
create table faqs (
    id uuid primary key default uuid_generate_v4(),
    question text not null,
    answer text not null,
    display_order integer default 0,
    is_visible boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. site_settings
create table site_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) Configurations
alter table artist_profile enable row level security;
alter table social_links enable row level security;
alter table artwork_categories enable row level security;
alter table artworks enable row level security;
alter table pricing_regions enable row level security;
alter table countries enable row level security;
alter table commission_types enable row level security;
alter table price_overrides enable row level security;
alter table commission_requests enable row level security;
alter table testimonials enable row level security;
alter table faqs enable row level security;
alter table site_settings enable row level security;

-- Policies for artist_profile
create policy "Allow public select for artist_profile" on artist_profile
    for select using (true);
create policy "Allow service role all for artist_profile" on artist_profile
    for all using (true);

-- Policies for social_links
create policy "Allow public select for social_links" on social_links
    for select using (true);
create policy "Allow service role all for social_links" on social_links
    for all using (true);

-- Policies for artwork_categories
create policy "Allow public select for artwork_categories" on artwork_categories
    for select using (true);
create policy "Allow service role all for artwork_categories" on artwork_categories
    for all using (true);

-- Policies for artworks
create policy "Allow public select for artworks" on artworks
    for select using (is_hidden = false and is_published = true);
create policy "Allow service role all for artworks" on artworks
    for all using (true);

-- Policies for pricing_regions
create policy "Allow public select for pricing_regions" on pricing_regions
    for select using (true);
create policy "Allow service role all for pricing_regions" on pricing_regions
    for all using (true);

-- Policies for countries
create policy "Allow public select for countries" on countries
    for select using (true);
create policy "Allow service role all for countries" on countries
    for all using (true);

-- Policies for commission_types
create policy "Allow public select for commission_types" on commission_types
    for select using (is_active = true);
create policy "Allow service role all for commission_types" on commission_types
    for all using (true);

-- Policies for price_overrides
create policy "Allow public select for price_overrides" on price_overrides
    for select using (true);
create policy "Allow service role all for price_overrides" on price_overrides
    for all using (true);

-- Policies for commission_requests
create policy "Allow public insert for commission_requests" on commission_requests
    for insert with check (true);
create policy "Allow service role all for commission_requests" on commission_requests
    for all using (true);

-- Policies for testimonials
create policy "Allow public select for testimonials" on testimonials
    for select using (is_visible = true);
create policy "Allow service role all for testimonials" on testimonials
    for all using (true);

-- Policies for faqs
create policy "Allow public select for faqs" on faqs
    for select using (is_visible = true);
create policy "Allow service role all for faqs" on faqs
    for all using (true);

-- Policies for site_settings
create policy "Allow public select for site_settings" on site_settings
    for select using (true);
create policy "Allow service role all for site_settings" on site_settings
    for all using (true);
