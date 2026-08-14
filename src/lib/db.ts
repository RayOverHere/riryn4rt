import { supabase } from './supabase';

export interface ArtistProfile {
  name: string;
  display_name: string;
  profile_image_url: string;
  short_intro: string;
  full_bio: string;
  location: string;
  commission_availability: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
  display_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  category_id: string;
  image_url: string;
  display_order: number;
  is_featured: boolean;
  is_hidden: boolean;
  is_published: boolean;
  tags: string[];
  created_at: string;
}

export interface CommissionType {
  id: string;
  title: string;
  description: string;
  base_price_idr: number;
  turnaround_time: string;
  revision_policy: string;
  commercial_usage_policy: string;
  is_active: boolean;
  display_order: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

export interface Testimonial {
  id: string;
  client_name: string;
  feedback: string;
  commission_type_title?: string;
  avatar_url: string;
  display_order: number;
}

// Fallback Mock Data matching seed.sql
const FALLBACK_PROFILE: ArtistProfile = {
  name: 'Mochi',
  display_name: 'MochiArt',
  profile_image_url: '/images/mochi-profile.svg',
  short_intro: 'Hi! I am Mochi, a digital illustrator who loves drawing cute, soft, and cozy characters and dreamlands. Welcome to my little studio!',
  full_bio: 'Hello, thank you for visiting my cozy space! I am a self-taught freelance digital artist based in Indonesia. I specialize in cute character design, soft pastel illustrations, and cozy background art. I have been drawing digitally for over 5 years, working with clients worldwide to bring their original characters and sweet memories to life through my warm, colorful art style. When I am not drawing, I am probably drinking strawberry milk, playing cozy indie games, or napping with my cat.',
  location: 'Bandung, Indonesia',
  commission_availability: true
};

const FALLBACK_SOCIALS: SocialLink[] = [
  { platform: 'instagram', url: 'https://instagram.com/mochiart', display_order: 1 },
  { platform: 'twitter', url: 'https://twitter.com/mochiart', display_order: 2 },
  { platform: 'bluesky', url: 'https://bsky.app/profile/mochiart.bsky.social', display_order: 3 },
  { platform: 'tiktok', url: 'https://tiktok.com/@mochiart', display_order: 4 }
];

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'cat-chibi', name: 'Chibi', slug: 'chibi', display_order: 1 },
  { id: 'cat-char', name: 'Character Illustration', slug: 'character-illustration', display_order: 2 },
  { id: 'cat-bg', name: 'Cozy Backgrounds', slug: 'cozy-backgrounds', display_order: 3 }
];

const FALLBACK_ARTWORKS: Artwork[] = [
  {
    id: 'art-1',
    title: 'Strawberry Dream',
    description: 'A cute character holding a giant strawberry cup in a pastel pink wonderland.',
    category_id: 'cat-chibi',
    image_url: '/images/gallery/strawberry-dream.svg',
    display_order: 1,
    is_featured: true,
    is_hidden: false,
    is_published: true,
    tags: ['chibi', 'strawberry', 'pastel'],
    created_at: new Date().toISOString()
  },
  {
    id: 'art-2',
    title: 'Cozy Rainy Afternoon',
    description: 'A warm drawing of an artist napping in a cozy room with rain pattering on the window.',
    category_id: 'cat-bg',
    image_url: '/images/gallery/rainy-afternoon.svg',
    display_order: 2,
    is_featured: true,
    is_hidden: false,
    is_published: true,
    tags: ['scenic', 'cozy', 'room', 'rain'],
    created_at: new Date().toISOString()
  },
  {
    id: 'art-3',
    title: 'Starlight Café',
    description: 'Enjoying a slice of blueberry cake and hot coffee at a magical café under the stars.',
    category_id: 'cat-bg',
    image_url: '/images/gallery/starlight-cafe.svg',
    display_order: 3,
    is_featured: true,
    is_hidden: false,
    is_published: true,
    tags: ['scenic', 'stars', 'cafe', 'magic'],
    created_at: new Date().toISOString()
  },
  {
    id: 'art-4',
    title: 'Sweet Bunny Picnic',
    description: 'Chibi bunny girl sitting on a checkered mat eating cupcakes with her tiny animal friends.',
    category_id: 'cat-chibi',
    image_url: '/images/gallery/bunny-picnic.svg',
    display_order: 4,
    is_featured: false,
    is_hidden: false,
    is_published: true,
    tags: ['chibi', 'bunny', 'picnic'],
    created_at: new Date().toISOString()
  },
  {
    id: 'art-5',
    title: 'Magical Library',
    description: 'A character floating among ancient magical books and warm glowing lanterns.',
    category_id: 'cat-char',
    image_url: '/images/gallery/magical-library.svg',
    display_order: 5,
    is_featured: false,
    is_hidden: false,
    is_published: true,
    tags: ['illustration', 'magic', 'books', 'night'],
    created_at: new Date().toISOString()
  },
  {
    id: 'art-6',
    title: 'Tea Party Invitation',
    description: 'A sweet detailed illustration of twin characters in maid outfits serving tea and biscuits.',
    category_id: 'cat-char',
    image_url: '/images/gallery/tea-party.svg',
    display_order: 6,
    is_featured: false,
    is_hidden: false,
    is_published: true,
    tags: ['illustration', 'lolita', 'tea-party'],
    created_at: new Date().toISOString()
  }
];

const FALLBACK_COMMISSIONS: CommissionType[] = [
  {
    id: 'comm-1',
    title: 'Cozy Chibi Icon',
    description: 'A soft, high-quality digital icon of your character from the chest up. Perfect for social media profiles! Includes a simple color/pattern background.',
    base_price_idr: 150000,
    turnaround_time: '1-2 weeks',
    revision_policy: '2 sketch adjustments, 1 minor color adjustment.',
    commercial_usage_policy: 'Personal use only.',
    is_active: true,
    display_order: 1
  },
  {
    id: 'comm-2',
    title: 'Full Body Chibi Character',
    description: 'A full body drawing of your character in my signature cute, squishy chibi style. Comes with transparent and simple backgrounds.',
    base_price_idr: 300000,
    turnaround_time: '2-3 weeks',
    revision_policy: '2 sketch revisions, 1 color revision.',
    commercial_usage_policy: 'Personal use base. Commercial use (merchandise/streaming) is +50%.',
    is_active: true,
    display_order: 2
  },
  {
    id: 'comm-3',
    title: 'Detailed Character Illustration',
    description: 'A complete anime-style character portrait (half or full body) with soft coloring, detailed shading, and dynamic lighting. Simple background.',
    base_price_idr: 600000,
    turnaround_time: '3-4 weeks',
    revision_policy: '3 sketch revisions, 2 color revisions.',
    commercial_usage_policy: 'Personal use base. Commercial use is +80%.',
    is_active: true,
    display_order: 3
  },
  {
    id: 'comm-4',
    title: 'Cozy Scenic Illustration',
    description: 'A full art piece showcasing your character in a warm, detailed environment (e.g. cozy café or starry picnic) with focus on background and lighting.',
    base_price_idr: 1200000,
    turnaround_time: '4-6 weeks',
    revision_policy: '3 sketch layouts, 2 progress checks, final polish.',
    commercial_usage_policy: 'Personal use base. Commercial use is +100%.',
    is_active: true,
    display_order: 4
  }
];

const FALLBACK_FAQS: FAQ[] = [
  { id: 'faq-1', question: 'How do I pay for the commission?', answer: 'I accept BCA and GoPay for Indonesian clients. International payments are made securely via PayPal or Stripe invoice.', display_order: 1 },
  { id: 'faq-2', question: 'What is your turnaround time?', answer: 'Varies by type: Icons take 1-2 weeks; full scenic illustrations can take up to 6 weeks. I send updates throughout the process.', display_order: 2 },
  { id: 'faq-3', question: 'Can you draw furry, mecha, or NSFW?', answer: 'I draw kemonomimi and simple armor, but do not draw mecha, heavy gore, or NSFW content.', display_order: 3 },
  { id: 'faq-4', question: 'What files will I receive?', answer: 'High-res 300 DPI PNG files sent via email or Google Drive (including transparent and simple backgrounds).', display_order: 4 }
];

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { id: 'test-1', client_name: 'Lulu', feedback: 'Mochi drew my VTuber model so beautifully! The colors are incredibly soft and communication was friendly.', commission_type_title: 'Full Body Chibi Character', avatar_url: '/images/avatars/client.svg', display_order: 1 },
  { id: 'test-2', client_name: 'Alex', feedback: 'In love with the scenic illustration! The warm room lighting is exactly what I wanted. Worth every penny!', commission_type_title: 'Cozy Scenic Illustration', avatar_url: '/images/avatars/client.svg', display_order: 2 },
  { id: 'test-3', client_name: 'Yuki', feedback: 'The chibi icons are super cute and perfect for my Twitch channel! Fast delivery and great sketch adjustments.', commission_type_title: 'Cozy Chibi Icon', avatar_url: '/images/avatars/client.svg', display_order: 3 }
];

// Helper wrapper to try-catch queries
async function safeQuery<T>(queryPromise: Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await queryPromise;
    if (error || !data) {
      return fallback;
    }
    return data;
  } catch (e) {
    console.error('Database query failed. Using static fallback data.', e);
    return fallback;
  }
}

export async function getArtistProfile(): Promise<ArtistProfile> {
  try {
    const { data, error } = await supabase.from('artist_profile').select('*').limit(1);
    if (error) {
      console.error('[db.ts] getArtistProfile error:', error.code, error.message);
      return FALLBACK_PROFILE;
    }
    if (!data || data.length === 0) {
      console.warn('[db.ts] getArtistProfile: table is empty, using fallback');
      return FALLBACK_PROFILE;
    }
    const row = data[0] as any;
    // Map DB columns → ArtistProfile interface (handles both old and new schema columns)
    return {
      name: row.name || row.display_name || FALLBACK_PROFILE.name,
      display_name: row.display_name || FALLBACK_PROFILE.display_name,
      profile_image_url: row.profile_image_url || FALLBACK_PROFILE.profile_image_url,
      short_intro: row.short_intro || row.tagline || FALLBACK_PROFILE.short_intro,
      full_bio: row.full_bio || row.bio || FALLBACK_PROFILE.full_bio,
      location: row.location || FALLBACK_PROFILE.location,
      commission_availability: row.commission_availability ?? FALLBACK_PROFILE.commission_availability,
      // Extra columns (from migration) — only present if migration was run
      tagline: row.tagline || row.short_intro || '',
      bio: row.bio || row.full_bio || '',
      social_links: row.social_links || {},
      commission_slots_total: row.commission_slots_total ?? 10,
      commission_slots_available: row.commission_slots_available ?? 5,
    } as any;
  } catch (e) {
    console.error('[db.ts] getArtistProfile exception:', e);
    return FALLBACK_PROFILE;
  }
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const { data, error } = await supabase.from('social_links').select('*').order('display_order', { ascending: true });
    if (error) {
      console.error('[db.ts] getSocialLinks error:', error.code, error.message, '— using fallback');
      return FALLBACK_SOCIALS;
    }
    if (!data || data.length === 0) {
      return FALLBACK_SOCIALS;
    }
    return data as SocialLink[];
  } catch (e) {
    console.error('[db.ts] getSocialLinks exception:', e);
    return FALLBACK_SOCIALS;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase.from('artwork_categories').select('*').order('display_order', { ascending: true });
    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIES;
    }
    return data as Category[];
  } catch (e) {
    return FALLBACK_CATEGORIES;
  }
}

export async function getArtworks(showAll = false): Promise<Artwork[]> {
  try {
    let query = supabase.from('artworks').select('*').order('display_order', { ascending: true });
    if (!showAll) {
      query = query.eq('is_hidden', false).eq('is_published', true);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[db.ts] getArtworks error:', error.code, error.message, '— using fallback data');
      return FALLBACK_ARTWORKS.filter(art => showAll || (!art.is_hidden && art.is_published));
    }
    if (!data || data.length === 0) {
      console.warn('[db.ts] getArtworks: no rows found in DB, using fallback data');
      return FALLBACK_ARTWORKS.filter(art => showAll || (!art.is_hidden && art.is_published));
    }
    return data as Artwork[];
  } catch (e) {
    console.error('[db.ts] getArtworks exception:', e);
    return FALLBACK_ARTWORKS.filter(art => showAll || (!art.is_hidden && art.is_published));
  }
}

export async function getFeaturedArtworks(): Promise<Artwork[]> {
  try {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('is_featured', true)
      .eq('is_hidden', false)
      .eq('is_published', true)
      .order('display_order', { ascending: true });
    if (error || !data || data.length === 0) {
      return FALLBACK_ARTWORKS.filter(art => art.is_featured && !art.is_hidden && art.is_published);
    }
    return data as Artwork[];
  } catch (e) {
    return FALLBACK_ARTWORKS.filter(art => art.is_featured && !art.is_hidden && art.is_published);
  }
}

export async function getCommissionTypes(showAll = false): Promise<CommissionType[]> {
  try {
    let query = supabase.from('commission_types').select('*').order('display_order', { ascending: true });
    if (!showAll) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return FALLBACK_COMMISSIONS.filter(c => showAll || c.is_active);
    }
    return data as CommissionType[];
  } catch (e) {
    return FALLBACK_COMMISSIONS.filter(c => showAll || c.is_active);
  }
}

export async function getFAQs(): Promise<FAQ[]> {
  try {
    const { data, error } = await supabase.from('faqs').select('*').eq('is_visible', true).order('display_order', { ascending: true });
    if (error || !data || data.length === 0) {
      return FALLBACK_FAQS;
    }
    return data as FAQ[];
  } catch (e) {
    return FALLBACK_FAQS;
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    // Join with commission_types to get their titles if available
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, client_name, feedback, avatar_url, display_order, commission_types(title)')
      .eq('is_visible', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_TESTIMONIALS;
    }

    return data.map((t: any) => ({
      id: t.id,
      client_name: t.client_name,
      feedback: t.feedback,
      commission_type_title: t.commission_types?.title,
      avatar_url: t.avatar_url || '',
      display_order: t.display_order
    })) as Testimonial[];
  } catch (e) {
    return FALLBACK_TESTIMONIALS;
  }
}

export async function getSiteSettings(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (error || !data) {
      return {};
    }
    const settings: Record<string, any> = {};
    data.forEach((row: any) => {
      settings[row.key] = row.value;
    });
    return settings;
  } catch (e) {
    return {};
  }
}

export interface Country {
  code: string;
  name: string;
  phone_prefix: string;
  currency_code?: string;
}

const FALLBACK_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', phone_prefix: '+1', currency_code: 'USD' },
  { code: 'ID', name: 'Indonesia', phone_prefix: '+62', currency_code: 'IDR' },
  { code: 'CA', name: 'Canada', phone_prefix: '+1', currency_code: 'CAD' },
  { code: 'GB', name: 'United Kingdom', phone_prefix: '+44', currency_code: 'GBP' },
  { code: 'SG', name: 'Singapore', phone_prefix: '+65', currency_code: 'SGD' },
  { code: 'MY', name: 'Malaysia', phone_prefix: '+60', currency_code: 'MYR' },
  { code: 'JP', name: 'Japan', phone_prefix: '+81', currency_code: 'JPY' },
  { code: 'AU', name: 'Australia', phone_prefix: '+61', currency_code: 'AUD' }
];

export async function getCountries(): Promise<Country[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      // Assuming currency_code is directly on countries or via pricing_regions
      // Let's query pricing_regions to get currency_code
      .select('code, name, phone_prefix, pricing_regions(currency_code)')
      .order('name', { ascending: true });
    
    if (error || !data || data.length === 0) {
      return FALLBACK_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));
    }
    return data.map((c: any) => ({
      code: c.code,
      name: c.name,
      phone_prefix: c.phone_prefix,
      currency_code: c.pricing_regions?.currency_code || 'USD'
    })) as Country[];
  } catch (e) {
    return FALLBACK_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));
  }
}

