-- =====================================================
-- FULL DATABASE SETUP + SEED
-- Run this ONCE in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/ywlgtgqjjimjnmacgegv/sql/new
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- STEP 1: Drop existing tables (ordered by dependency)
-- =====================================================
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

-- =====================================================
-- STEP 2: Create tables (with ALL required columns)
-- =====================================================

-- 1. artist_profile (with extra admin columns)
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
    platform text not null,
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
    name text not null unique,
    currency_code text not null default 'USD',
    regional_multiplier numeric(10,2) not null default 1.00,
    exchange_rate numeric(15,6) not null default 1.000000,
    last_exchange_rate_update timestamp with time zone default timezone('utc'::text, now()) not null,
    rounding_method text not null default 'nearest_5',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. countries
create table countries (
    code text primary key,
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
    base_price_idr numeric(15,2) not null,
    turnaround_time text,
    revision_policy text,
    commercial_usage_policy text,
    is_active boolean default true,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. price_overrides
create table price_overrides (
    id uuid primary key default uuid_generate_v4(),
    commission_type_id uuid references commission_types(id) on delete cascade not null,
    pricing_region_id uuid references pricing_regions(id) on delete cascade not null,
    override_price numeric(15,2) not null,
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
    preferred_contact_method text not null,
    commission_type_id uuid references commission_types(id) on delete restrict not null,
    character_count integer not null default 1,
    description text not null,
    reference_images text[] not null default '{}',
    desired_deadline date,
    is_commercial boolean not null default false,
    additional_notes text,
    status text not null default 'new',
    internal_notes text,
    quoted_price numeric(15,2) not null,
    currency text not null,
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

-- =====================================================
-- STEP 3: Enable RLS + Policies
-- =====================================================
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

create policy "Public select artist_profile" on artist_profile for select using (true);
create policy "Service role all artist_profile" on artist_profile for all using (true);

create policy "Public select social_links" on social_links for select using (true);
create policy "Service role all social_links" on social_links for all using (true);

create policy "Public select artwork_categories" on artwork_categories for select using (true);
create policy "Service role all artwork_categories" on artwork_categories for all using (true);

create policy "Public select artworks" on artworks for select using (is_hidden = false and is_published = true);
create policy "Service role all artworks" on artworks for all using (true);

create policy "Public select pricing_regions" on pricing_regions for select using (true);
create policy "Service role all pricing_regions" on pricing_regions for all using (true);

create policy "Public select countries" on countries for select using (true);
create policy "Service role all countries" on countries for all using (true);

create policy "Public select commission_types" on commission_types for select using (is_active = true);
create policy "Service role all commission_types" on commission_types for all using (true);

create policy "Public select price_overrides" on price_overrides for select using (true);
create policy "Service role all price_overrides" on price_overrides for all using (true);

create policy "Public insert commission_requests" on commission_requests for insert with check (true);
create policy "Service role all commission_requests" on commission_requests for all using (true);

create policy "Public select testimonials" on testimonials for select using (is_visible = true);
create policy "Service role all testimonials" on testimonials for all using (true);

create policy "Public select faqs" on faqs for select using (is_visible = true);
create policy "Service role all faqs" on faqs for all using (true);

create policy "Public select site_settings" on site_settings for select using (true);
create policy "Service role all site_settings" on site_settings for all using (true);

-- =====================================================
-- STEP 4: Seed Data
-- =====================================================

-- artist_profile
insert into artist_profile (id, name, display_name, profile_image_url, short_intro, tagline, full_bio, bio, location, commission_availability, commission_slots_total, commission_slots_available, social_links)
values (
    'a3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bc',
    'Mochi',
    'MochiArt',
    '/images/mochi-profile.svg',
    'Hi! I am Mochi, a digital illustrator who loves drawing cute, soft, and cozy characters and dreamlands. Welcome to my little studio!',
    'Soft & dreamy digital art commissions',
    'Hello, thank you for visiting my cozy space! I am a self-taught freelance digital artist based in Indonesia. I specialize in cute character design, soft pastel illustrations, and cozy background art.',
    'Hello, thank you for visiting my cozy space! I am a self-taught freelance digital artist based in Indonesia. I specialize in cute character design, soft pastel illustrations, and cozy background art.',
    'Bandung, Indonesia',
    true,
    10,
    5,
    '{"twitter": "https://twitter.com/mochiart", "instagram": "https://instagram.com/mochiart", "deviantart": ""}'::jsonb
) on conflict (id) do nothing;

-- social_links
insert into social_links (platform, url, display_order) values
('instagram', 'https://instagram.com/mochiart', 1),
('twitter', 'https://twitter.com/mochiart', 2),
('bluesky', 'https://bsky.app/profile/mochiart.bsky.social', 3),
('tiktok', 'https://tiktok.com/@mochiart', 4)
on conflict do nothing;

-- artwork_categories
insert into artwork_categories (id, name, slug, display_order) values
('b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bd', 'Chibi', 'chibi', 1),
('c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7be', 'Character Illustration', 'character-illustration', 2),
('d3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bf', 'Cozy Backgrounds', 'cozy-backgrounds', 3)
on conflict (id) do nothing;

-- pricing_regions
insert into pricing_regions (id, name, currency_code, regional_multiplier, exchange_rate, rounding_method) values
('e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c0', 'Indonesia', 'IDR', 1.00, 1.000000, 'nearest_10000'),
('f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', 'North America', 'USD', 1.00, 15000.000000, 'nearest_5'),
('03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', 'Europe', 'EUR', 0.95, 16000.000000, 'nearest_5'),
('13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', 'Southeast Asia', 'SGD', 1.00, 11000.000000, 'nearest_5'),
('23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', 'Default International', 'USD', 1.00, 15000.000000, 'nearest_5')
on conflict (name) do nothing;

-- countries
insert into countries (code, name, pricing_region_id, phone_prefix) values
('ID', 'Indonesia', 'e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c0', '+62'),
('US', 'United States', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', '+1'),
('CA', 'Canada', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', '+1'),
('MX', 'Mexico', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', '+52'),
('GB', 'United Kingdom', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+44'),
('DE', 'Germany', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+49'),
('FR', 'France', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+33'),
('IT', 'Italy', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+39'),
('ES', 'Spain', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+34'),
('NL', 'Netherlands', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+31'),
('SG', 'Singapore', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+65'),
('MY', 'Malaysia', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+60'),
('PH', 'Philippines', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+63'),
('TH', 'Thailand', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+66'),
('VN', 'Vietnam', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+84'),
('AU', 'Australia', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+61'),
('NZ', 'New Zealand', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+64'),
('JP', 'Japan', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+81'),
('KR', 'South Korea', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+82'),
('BR', 'Brazil', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+55')
on conflict (code) do nothing;

-- commission_types
insert into commission_types (id, title, description, base_price_idr, turnaround_time, revision_policy, commercial_usage_policy, display_order) values
('33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', 'Cozy Chibi Icon', 'A soft, high-quality digital icon of your character from the chest up. Perfect for social media profiles! Includes a simple color/pattern background of your choice.', 150000.00, '1-2 weeks', '2 sketch adjustments, 1 minor color adjustment at the end.', 'Personal use only. Commercial use is not allowed for icons.', 1),
('43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6', 'Full Body Chibi character', 'A full body drawing of your original character or persona in my signature cute, squishy chibi style. Comes with transparent and simple decorative backgrounds.', 300000.00, '2-3 weeks', '2 sketch revisions, 1 color revision.', 'Personal use only. For commercial use (merchandise, streams), a +50% fee is applied.', 2),
('53c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c7', 'Detailed Character Illustration', 'A complete anime-style character portrait (half body to full body) with soft coloring, detailed shading, and dynamic lighting. Simple aesthetic background included.', 600000.00, '3-4 weeks', '3 sketch revisions, 2 color/lighting revisions.', 'Personal use base. Commercial usage is available for +80% of final price.', 3),
('63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8', 'Cozy Scenic Illustration', 'A full art piece showcasing your character in a warm, detailed scene (like a cozy café, messy bedroom, or starry picnic). Focuses heavily on environment, storytelling, and warm lighting.', 1200000.00, '4-6 weeks', '3 sketch layout options, 2 progress update checks, final color polish.', 'Personal use base. Commercial usage (games, promotional material) is +100% of final price.', 4)
on conflict (id) do nothing;

-- price_overrides
insert into price_overrides (commission_type_id, pricing_region_id, override_price) values
('33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', 15.00),
('33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', 15.00)
on conflict (commission_type_id, pricing_region_id) do nothing;

-- faqs
insert into faqs (question, answer, display_order) values
('How do I pay for the commission?', 'I accept Bank Central Asia (BCA) and GoPay for Indonesian clients. For international clients, payments can be made securely via PayPal or Stripe (we will send an invoice link once your request is accepted).', 1),
('What is your turnaround time?', 'It varies by commission type. A Chibi Icon takes 1-2 weeks, while full scenic illustrations can take up to 6 weeks. I will keep you updated with progress screenshots throughout the process!', 2),
('Can you draw furry, mecha, or NSFW?', 'I can draw kemonomimi (human with animal ears/tails) and simple armor! However, I do not draw mecha, heavy gore, or NSFW content. If you are unsure, feel free to submit a request and I will review it!', 3),
('What files will I receive?', 'You will receive high-resolution PNG files (300 DPI) sent via email or a private Google Drive folder, including a transparent background version and a simple colored background version.', 4)
on conflict do nothing;

-- testimonials
insert into testimonials (client_name, feedback, commission_type_id, avatar_url, display_order) values
('Lulu', 'Mochi drew my VTuber model so beautifully! The colors are incredibly soft and the details are adorable. Communication was super smooth and friendly!', '43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6', '/images/avatars/client.svg', 1),
('Alex', 'Absolutely in love with the scenic illustration Mochi did of my character! The warm room lighting is exactly what I wanted. Worth every penny, will commission again!', '63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8', '/images/avatars/client.svg', 2),
('Yuki', 'The chibi icons are super cute and perfect for my Twitch channel! Fast delivery and Mochi was very open to my adjustments during the sketching stage.', '33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', '/images/avatars/client.svg', 3)
on conflict do nothing;

-- artworks (placeholder URLs — replace with Supabase Storage URLs after uploading)
insert into artworks (title, description, category_id, image_url, display_order, is_featured, tags) values
('Strawberry Dream', 'A cute character holding a giant strawberry cup in a pastel pink wonderland.', 'b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bd', '/images/gallery/strawberry-dream.svg', 1, true, ARRAY['chibi', 'strawberry', 'pastel']),
('Cozy Rainy Afternoon', 'A warm drawing of an artist napping in a cozy room with rain pattering on the window.', 'd3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bf', '/images/gallery/rainy-afternoon.svg', 2, true, ARRAY['scenic', 'cozy', 'room', 'rain']),
('Starlight Café', 'Enjoying a slice of blueberry cake and hot coffee at a magical café under the stars.', 'd3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bf', '/images/gallery/starlight-cafe.svg', 3, true, ARRAY['scenic', 'stars', 'cafe', 'magic']),
('Sweet Bunny Picnic', 'Chibi bunny girl sitting on a checkered mat eating cupcakes with her tiny animal friends.', 'b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bd', '/images/gallery/bunny-picnic.svg', 4, false, ARRAY['chibi', 'bunny', 'picnic']),
('Magical Library', 'A character floating among ancient magical books and warm glowing lanterns.', 'c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7be', '/images/gallery/magical-library.svg', 5, false, ARRAY['illustration', 'magic', 'books', 'night']),
('Tea Party Invitation', 'A sweet detailed illustration of twin characters in maid outfits serving tea and biscuits.', 'c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7be', '/images/gallery/tea-party.svg', 6, false, ARRAY['illustration', 'lolita', 'tea-party'])
on conflict do nothing;
