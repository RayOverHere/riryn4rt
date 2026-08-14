import type { SocialImageResolver, ResolveResult } from './types';
import { fetchAndValidateImage, extractMetaImage } from './imageUtils';

export class InstagramResolver implements SocialImageResolver {
  name = 'Instagram';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return host === 'instagram.com' || host === 'www.instagram.com' || host === 'instagr.am';
  }

  async resolve(url: URL): Promise<ResolveResult> {
    // Attempt public oEmbed check
    try {
      const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url.toString())}`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.thumbnail_url) {
          const val = await fetchAndValidateImage(data.thumbnail_url, 'Instagram');
          if (val.success && val.image) {
            return { success: true, image: val.image, platform: 'Instagram' };
          }
        }
      }
    } catch {
      // Ignore network errors
    }

    // Instagram blocks automated scrapers and requires Graph API OAuth tokens for post media.
    // Return honest failure message as specified in Section 6.
    return {
      success: false,
      error: 'Instagram image could not be imported automatically. Please upload the image directly instead.',
      platform: 'Instagram',
      canFallbackToDirectUpload: true
    };
  }
}
