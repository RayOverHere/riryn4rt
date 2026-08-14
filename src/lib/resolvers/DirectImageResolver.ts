import type { SocialImageResolver, ResolveResult } from './types';
import { fetchAndValidateImage } from './imageUtils';

export class DirectImageResolver implements SocialImageResolver {
  name = 'Direct Image URL';

  canHandle(url: URL): boolean {
    const pathname = url.pathname.toLowerCase();
    // Handles common image extensions or any generic host if fallback
    const hasImageExt = /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(pathname);
    return hasImageExt || true; // Fallback resolver for any non-social link
  }

  async resolve(url: URL): Promise<ResolveResult> {
    const result = await fetchAndValidateImage(url.toString(), 'Direct URL');
    if (!result.success || !result.image) {
      return {
        success: false,
        error: result.error || 'Could not validate target URL as a direct image.',
        platform: 'Direct URL',
        canFallbackToDirectUpload: true
      };
    }

    return {
      success: true,
      image: result.image,
      platform: 'Direct URL'
    };
  }
}
