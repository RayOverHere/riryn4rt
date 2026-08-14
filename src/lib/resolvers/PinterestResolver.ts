import type { SocialImageResolver, ResolveResult } from './types';
import { fetchAndValidateImage, extractMetaImage } from './imageUtils';

export class PinterestResolver implements SocialImageResolver {
  name = 'Pinterest';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return host.includes('pinterest.com') || host === 'pin.it';
  }

  async resolve(url: URL): Promise<ResolveResult> {
    try {
      // Try Pinterest oEmbed
      const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url.toString())}`;
      const oembedRes = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'MochiArtStudio/1.0' }
      });

      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const imgUrl = data.thumbnail_url || data.url;
        if (imgUrl) {
          const val = await fetchAndValidateImage(imgUrl, 'Pinterest');
          if (val.success && val.image) {
            return { success: true, image: val.image, platform: 'Pinterest' };
          }
        }
      }

      // Try fetching public meta tag
      const pageRes = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const metaImg = extractMetaImage(html);
        if (metaImg && !metaImg.includes('logo')) {
          const val = await fetchAndValidateImage(metaImg, 'Pinterest');
          if (val.success && val.image) {
            return { success: true, image: val.image, platform: 'Pinterest' };
          }
        }
      }
    } catch {
      // Ignore network errors
    }

    return {
      success: false,
      error: 'Pinterest image could not be imported automatically. Please use the direct image URL or upload the image.',
      platform: 'Pinterest',
      canFallbackToDirectUpload: true
    };
  }
}
