import type { SocialImageResolver, ResolveResult } from './types';
import { fetchAndValidateImage, extractMetaImage } from './imageUtils';
import { validateUrlForSSRF } from './ssrfGuard';

export class ImgurResolver implements SocialImageResolver {
  name = 'Imgur';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return host === 'imgur.com' || host === 'www.imgur.com' || host === 'i.imgur.com';
  }

  async resolve(url: URL): Promise<ResolveResult> {
    const host = url.hostname.toLowerCase();

    // 1. Direct Imgur image URL (e.g. i.imgur.com/abc.jpg)
    if (host === 'i.imgur.com' || /\.(jpg|jpeg|png|gif|webp)$/i.test(url.pathname)) {
      const res = await fetchAndValidateImage(url.toString(), 'Imgur (Direct)');
      if (res.success && res.image) {
        return { success: true, image: res.image, platform: 'Imgur' };
      }
    }

    // 2. Imgur page URL (e.g. imgur.com/xyz or imgur.com/a/xyz)
    const ssrfCheck = await validateUrlForSSRF(url.toString());
    if (!ssrfCheck.valid || !ssrfCheck.url) {
      return { success: false, error: ssrfCheck.error, platform: 'Imgur', canFallbackToDirectUpload: true };
    }

    try {
      // Try Imgur oEmbed endpoint first
      const oembedUrl = `https://api.imgur.com/oembed.json?url=${encodeURIComponent(url.toString())}`;
      const oembedRes = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'MochiStudioApp/1.0' }
      });

      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const rawUrl = data.url || data.thumbnail_url;
        if (rawUrl) {
          const res = await fetchAndValidateImage(rawUrl, 'Imgur');
          if (res.success && res.image) {
            return { success: true, image: res.image, platform: 'Imgur' };
          }
        }
      }

      // Fallback: Fetch page HTML and extract og:image
      const pageRes = await fetch(ssrfCheck.url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const metaImg = extractMetaImage(html);
        if (metaImg) {
          const res = await fetchAndValidateImage(metaImg, 'Imgur');
          if (res.success && res.image) {
            return { success: true, image: res.image, platform: 'Imgur' };
          }
        }
      }
    } catch {
      // Ignore network errors and return user-friendly fallback
    }

    return {
      success: false,
      error: 'Could not retrieve image from Imgur URL. Please use a direct image URL (i.imgur.com/...) or upload the image file directly.',
      platform: 'Imgur',
      canFallbackToDirectUpload: true
    };
  }
}
