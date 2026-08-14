import type { SocialImageResolver, ResolveResult } from './types';
import { fetchAndValidateImage, extractMetaImage } from './imageUtils';

export class XResolver implements SocialImageResolver {
  name = 'Twitter / X';

  canHandle(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return host === 'x.com' || host === 'www.x.com' || host === 'twitter.com' || host === 'www.twitter.com';
  }

  async resolve(url: URL): Promise<ResolveResult> {
    const urlStr = url.toString();

    try {
      // 1. Try Twitter public oEmbed API
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(urlStr)}&omit_script=true`;
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      if (res.ok) {
        const data = await res.json();
        const html = data.html || '';

        // Extract twimg media URL from HTML or pic.twitter.com / pbs.twimg.com/media
        const twimgMatch = html.match(/https:\/\/pbs\.twimg\.com\/media\/[a-zA-Z0-9_-]+(\?format=[a-z]+&name=[a-z0-9]+|\.[a-z]+)/i);
        if (twimgMatch && twimgMatch[0]) {
          // Normalize to large format
          let imgUrl = twimgMatch[0];
          if (imgUrl.includes('?')) {
            imgUrl = imgUrl.replace(/name=[a-z0-9]+/, 'name=large');
          }

          const val = await fetchAndValidateImage(imgUrl, 'Twitter / X');
          if (val.success && val.image) {
            return { success: true, image: val.image, platform: 'Twitter / X' };
          }
        }
      }

      // 2. Try fetching public meta tags (vxtwitter / fxtwitter / fixupx fallback endpoints if standard is blocked)
      const fixUrl = urlStr.replace(/\/\/(x\.com|twitter\.com)/, '//api.vxtwitter.com');
      const fixRes = await fetch(fixUrl, {
        headers: { 'User-Agent': 'MochiArtStudio/1.0' }
      });

      if (fixRes.ok) {
        const data = await fixRes.json();
        if (data.media_extended && data.media_extended.length > 0) {
          const media = data.media_extended.find((m: any) => m.type === 'image') || data.media_extended[0];
          if (media && media.url) {
            const val = await fetchAndValidateImage(media.url, 'Twitter / X');
            if (val.success && val.image) {
              return { success: true, image: val.image, platform: 'Twitter / X' };
            }
          }
        }
      }

    } catch {
      // Ignore network errors
    }

    // Honest failure as requested by user
    return {
      success: false,
      error: 'This X post could not be imported automatically. Please upload the image directly instead.',
      platform: 'Twitter / X',
      canFallbackToDirectUpload: true
    };
  }
}
