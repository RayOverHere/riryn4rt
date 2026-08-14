-- Supabase Seed Data
-- Digital Artist Portfolio & Commission Platform

-- 1. Seed artist_profile
insert into artist_profile (id, name, display_name, profile_image_url, short_intro, full_bio, location, commission_availability)
values (
    'a3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bc',
    'Mochi',
    'MochiArt',
    '/images/mochi-profile.svg',
    'Hi! I am Mochi, a digital illustrator who loves drawing cute, soft, and cozy characters and dreamlands. Welcome to my little studio!',
    'Hello, thank you for visiting my cozy space! I am a self-taught freelance digital artist based in Indonesia. I specialize in cute character design, soft pastel illustrations, and cozy background art. I have been drawing digitally for over 5 years, working with clients worldwide to bring their original characters and sweet memories to life through my warm, colorful art style. When I am not drawing, I am probably drinking strawberry milk, playing cozy indie games, or napping with my cat.',
    'Bandung, Indonesia',
    true
) on conflict do nothing;

-- 2. Seed social_links
insert into social_links (platform, url, display_order) values
('instagram', 'https://instagram.com/mochiart', 1),
('twitter', 'https://twitter.com/mochiart', 2),
('bluesky', 'https://bsky.app/profile/mochiart.bsky.social', 3),
('tiktok', 'https://tiktok.com/@mochiart', 4);

-- 3. Seed artwork_categories
insert into artwork_categories (id, name, slug, display_order) values
('b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bd', 'Chibi', 'chibi', 1),
('c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7be', 'Character Illustration', 'character-illustration', 2),
('d3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bf', 'Cozy Backgrounds', 'cozy-backgrounds', 3);

-- 4. Seed pricing_regions
insert into pricing_regions (id, name, currency_code, regional_multiplier, exchange_rate, rounding_method) values
('e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c0', 'Indonesia', 'IDR', 1.00, 1.000000, 'nearest_10000'),
('f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', 'North America', 'USD', 1.00, 15000.000000, 'nearest_5'),
('03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', 'Europe', 'EUR', 0.95, 16000.000000, 'nearest_5'),
('13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', 'Southeast Asia', 'SGD', 1.00, 11000.000000, 'nearest_5'),
('23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', 'Default International', 'USD', 1.00, 15000.000000, 'nearest_5');

-- 5. Seed countries
insert into countries (code, name, pricing_region_id, phone_prefix) values
-- Indonesia
('ID', 'Indonesia', 'e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c0', '+62'),

-- North America
('US', 'United States', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', '+1'),
('CA', 'Canada', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', '+1'),
('MX', 'Mexico', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', '+52'),

-- Europe
('GB', 'United Kingdom', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+44'),
('DE', 'Germany', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+49'),
('FR', 'France', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+33'),
('IT', 'Italy', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+39'),
('ES', 'Spain', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+34'),
('NL', 'Netherlands', '03c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c2', '+31'),

-- Southeast Asia
('SG', 'Singapore', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+65'),
('MY', 'Malaysia', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+60'),
('PH', 'Philippines', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+63'),
('TH', 'Thailand', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+66'),
('VN', 'Vietnam', '13c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c3', '+84'),

-- Default International (common fallbacks)
('AU', 'Australia', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+61'),
('NZ', 'New Zealand', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+64'),
('JP', 'Japan', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+81'),
('KR', 'South Korea', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+82'),
('BR', 'Brazil', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', '+55');

-- 6. Seed commission_types
insert into commission_types (id, title, description, base_price_idr, turnaround_time, revision_policy, commercial_usage_policy, display_order) values
(
    '33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5',
    'Cozy Chibi Icon',
    'A soft, high-quality digital icon of your character from the chest up. Perfect for social media profiles! Includes a simple color/pattern background of your choice.',
    150000.00, -- Rp150.000 (~$10 USD base)
    '1-2 weeks',
    '2 sketch adjustments, 1 minor color adjustment at the end.',
    'Personal use only. Commercial use is not allowed for icons.',
    1
),
(
    '43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6',
    'Full Body Chibi character',
    'A full body drawing of your original character or persona in my signature cute, squishy chibi style. Comes with transparent and simple decorative backgrounds.',
    300000.00, -- Rp300.000 (~$20 USD base)
    '2-3 weeks',
    '2 sketch revisions, 1 color revision.',
    'Personal use only. For commercial use (merchandise, streams), a +50% fee is applied.',
    2
),
(
    '53c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c7',
    'Detailed Character Illustration',
    'A complete anime-style character portrait (half body to full body) with soft coloring, detailed shading, and dynamic lighting. Simple aesthetic background included.',
    600000.00, -- Rp600.000 (~$40 USD base)
    '3-4 weeks',
    '3 sketch revisions, 2 color/lighting revisions.',
    'Personal use base. Commercial usage is available for +80% of final price.',
    3
),
(
    '63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8',
    'Cozy Scenic Illustration',
    'A full art piece showcasing your character in a warm, detailed scene (like a cozy café, messy bedroom, or starry picnic). Focuses heavily on environment, storytelling, and warm lighting.',
    1200000.00, -- Rp1.200.000 (~$80 USD base)
    '4-6 weeks',
    '3 sketch layout options, 2 progress update checks, final color polish.',
    'Personal use base. Commercial usage (games, promotional material) is +100% of final price.',
    4
);

-- 7. Seed price_overrides
-- E.g., we manually set Chibi Icon in US/International to be $15 USD (instead of $10 calculated by base_price_idr = 150000 / exchange_rate = 15000 = $10)
insert into price_overrides (commission_type_id, pricing_region_id, override_price) values
('33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c1', 15.00), -- US Override: $15 USD
('33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', '23c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c4', 15.00); -- Default Intl Override: $15 USD

-- 8. Seed faqs
insert into faqs (question, answer, display_order) values
('How do I pay for the commission?', 'I accept Bank Central Asia (BCA) and GoPay for Indonesian clients. For international clients, payments can be made securely via PayPal or Stripe (we will send an invoice link once your request is accepted).', 1),
('What is your turnaround time?', 'It varies by commission type. A Chibi Icon takes 1-2 weeks, while full scenic illustrations can take up to 6 weeks. I will keep you updated with progress screenshots throughout the process!', 2),
('Can you draw furry, mecha, or NSFW?', 'I can draw kemonomimi (human with animal ears/tails) and simple armor! However, I do not draw mecha, heavy gore, or NSFW content. If you are unsure, feel free to submit a request and I will review it!', 3),
('What files will I receive?', 'You will receive high-resolution PNG files (300 DPI) sent via email or a private Google Drive folder, including a transparent background version and a simple colored background version.', 4);

-- 9. Seed testimonials
insert into testimonials (client_name, feedback, commission_type_id, avatar_url, display_order) values
('Lulu', 'Mochi drew my VTuber model so beautifully! The colors are incredibly soft and the details are adorable. Communication was super smooth and friendly!', '43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6', '/images/avatars/client.svg', 1),
('Alex', 'Absolutely in love with the scenic illustration Mochi did of my character! The warm room lighting is exactly what I wanted. Worth every penny, will commission again!', '63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8', '/images/avatars/client.svg', 2),
('Yuki', 'The chibi icons are super cute and perfect for my Twitch channel! Fast delivery and Mochi was very open to my adjustments during the sketching stage.', '33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', '/images/avatars/client.svg', 3);

-- 10. Seed artworks (using local fallback URLs that will look beautiful)
insert into artworks (title, description, category_id, image_url, display_order, is_featured, tags) values
('Strawberry Dream', 'A cute character holding a giant strawberry cup in a pastel pink wonderland.', 'b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bd', '/images/gallery/strawberry-dream.svg', 1, true, ARRAY['chibi', 'strawberry', 'pastel']),
('Cozy Rainy Afternoon', 'A warm drawing of an artist napping in a cozy room with rain pattering on the window.', 'd3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bf', '/images/gallery/rainy-afternoon.svg', 2, true, ARRAY['scenic', 'cozy', 'room', 'rain']),
('Starlight Café', 'Enjoying a slice of blueberry cake and hot coffee at a magical café under the stars.', 'd3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bf', '/images/gallery/starlight-cafe.svg', 3, true, ARRAY['scenic', 'stars', 'cafe', 'magic']),
('Sweet Bunny Picnic', 'Chibi bunny girl sitting on a checkered mat eating cupcakes with her tiny animal friends.', 'b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7bd', '/images/gallery/bunny-picnic.svg', 4, false, ARRAY['chibi', 'bunny', 'picnic']),
('Magical Library', 'A character floating among ancient magical books and warm glowing lanterns.', 'c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7be', '/images/gallery/magical-library.svg', 5, false, ARRAY['illustration', 'magic', 'books', 'night']),
('Tea Party Invitation', 'A sweet detailed illustration of twin characters in maid outfits serving tea and biscuits.', 'c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7be', '/images/gallery/tea-party.svg', 6, false, ARRAY['illustration', 'lolita', 'tea-party']);

