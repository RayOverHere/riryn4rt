import React, { useState, useEffect, useCallback } from 'react';

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

export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface GalleryProps {
  initialArtworks: Artwork[];
  categories: Category[];
}

export default function GalleryExhibition({ initialArtworks, categories }: GalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Filter artworks when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setArtworks(initialArtworks);
    } else {
      setArtworks(initialArtworks.filter(art => art.category_id === selectedCategory));
    }
  }, [selectedCategory, initialArtworks]);

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (activeLightboxIndex === null) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') navigateLightbox(1);
    else if (e.key === 'ArrowLeft') navigateLightbox(-1);
  }, [activeLightboxIndex, artworks]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const openLightbox = (index: number) => {
    setActiveLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setActiveLightboxIndex(null);
    document.body.style.overflow = '';
  };

  const navigateLightbox = (direction: number) => {
    if (activeLightboxIndex === null) return;
    const newIndex = (activeLightboxIndex + direction + artworks.length) % artworks.length;
    setActiveLightboxIndex(newIndex);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  const currentArt = activeLightboxIndex !== null ? artworks[activeLightboxIndex] : null;

  return (
    <div class="flex flex-col gap-10">
      {/* Category Filter Pills */}
      <div class="flex flex-wrap justify-center gap-2 md:gap-3">
        <button
          onClick={() => setSelectedCategory('all')}
          class={`px-5 py-2 rounded-full font-display font-bold text-sm md:text-base border-2 transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-roseaccent border-roseaccent text-white shadow-[0_3px_0_var(--color-rosemid)]'
              : 'bg-white/70 border-babypink text-darkpink hover:border-roseaccent hover:text-darkpink-deep shadow-[0_3px_0_var(--color-candy)]'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            class={`px-5 py-2 rounded-full font-display font-bold text-sm md:text-base border-2 transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-roseaccent border-roseaccent text-white shadow-[0_3px_0_var(--color-rosemid)]'
                : 'bg-white/70 border-babypink text-darkpink hover:border-roseaccent hover:text-darkpink-deep shadow-[0_3px_0_var(--color-candy)]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      {artworks.length === 0 ? (
        <div class="text-center py-20 text-darkpink-muted font-display font-bold text-xl glass-surface rounded-3xl border-2 border-dashed border-babypink">
          🌸 No artworks in this category yet!
        </div>
      ) : (
        <div class="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {artworks.map((art, idx) => (
            <div
              key={art.id}
              onClick={() => openLightbox(idx)}
              class="gallery-card break-inside-avoid group"
            >
              {/* Image — natural aspect ratio, no cropping */}
              <div class="w-full overflow-hidden bg-blush">
                <img
                  src={art.image_url}
                  alt={art.title}
                  class="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              {/* Caption bar */}
              <div class="px-4 py-3 flex items-center justify-between gap-2">
                <span class="font-display font-bold text-sm text-darkpink-deep truncate">{art.title}</span>
                <span class="text-[11px] font-bold text-roseaccent bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-wide shrink-0">
                  {getCategoryName(art.category_id)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {activeLightboxIndex !== null && currentArt && (
        <div
          class="fixed inset-0 bg-darkpink-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) closeLightbox(); }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            class="absolute top-4 right-4 md:top-6 md:right-6 bg-white/90 text-darkpink hover:text-roseaccent border border-babypink rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110 z-50"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" class="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          <button
            onClick={() => navigateLightbox(-1)}
            class="absolute left-2 md:left-5 bg-white/90 text-darkpink hover:text-roseaccent border border-babypink rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110 z-50"
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" class="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Lightbox Card */}
          <div class="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-babypink">
            {/* Image */}
            <div class="flex-1 bg-blush flex items-center justify-center p-4 md:p-6 min-h-[280px] md:min-h-0">
              <img
                src={currentArt.image_url}
                alt={currentArt.title}
                class="max-w-full max-h-[45vh] md:max-h-[75vh] object-contain rounded-xl"
              />
            </div>
            {/* Details */}
            <div class="w-full md:w-72 border-t md:border-t-0 md:border-l border-candy p-5 flex flex-col justify-between overflow-y-auto">
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-roseaccent bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-wide">
                    {getCategoryName(currentArt.category_id)}
                  </span>
                  <span class="text-xs text-darkpink-muted font-semibold">
                    {activeLightboxIndex + 1} / {artworks.length}
                  </span>
                </div>
                <h2 class="text-xl font-display text-darkpink-deep">{currentArt.title}</h2>
                {currentArt.description && (
                  <p class="text-darkpink font-medium text-sm leading-relaxed">{currentArt.description}</p>
                )}
              </div>
              <a href="/commissions" class="cute-btn text-center text-sm py-2 mt-4">
                Commission Similar ✨
              </a>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={() => navigateLightbox(1)}
            class="absolute right-2 md:right-5 bg-white/90 text-darkpink hover:text-roseaccent border border-babypink rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110 z-50"
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" class="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}



