import type { SocialImageResolver, ResolveResult } from './types';
import { fetchAndValidateImage, extractMetaImage } from './imageUtils';

export class ArtStationResolver implements SocialImageResolver {
  name = 'ArtStation';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return host === 'artstation.com' || host === 'www.artstation.com';
  }

  async resolve(url: URL): Promise<ResolveResult> {
    try {
      // ArtStation artwork URLs are e.g. https://www.artstation.com/artwork/[hash]
      const pageRes = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const metaImg = extractMetaImage(html);
        if (metaImg && (metaImg.includes('artstation.com') || metaImg.includes('cdna.artstation.com'))) {
          const val = await fetchAndValidateImage(metaImg, 'ArtStation');
          if (val.success && val.image) {
            return { success: true, image: val.image, platform: 'ArtStation' };
          }
        }
      }
    } catch {
      // Ignore network errors
    }

    return {
      success: false,
      error: 'ArtStation image could not be imported automatically. Please use the direct image URL or upload the image file directly.',
      platform: 'ArtStation',
      canFallbackToDirectUpload: true
    };
  }
}
