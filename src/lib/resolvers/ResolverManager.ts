import type { SocialImageResolver, ResolveResult } from './types';
import { validateUrlForSSRF } from './ssrfGuard';
import { ImgurResolver } from './ImgurResolver';
import { XResolver } from './XResolver';
import { InstagramResolver } from './InstagramResolver';
import { PinterestResolver } from './PinterestResolver';
import { ArtStationResolver } from './ArtStationResolver';
import { DirectImageResolver } from './DirectImageResolver';

export class ResolverManager {
  private resolvers: SocialImageResolver[];

  constructor() {
    // Specific platform resolvers registered in priority order
    this.resolvers = [
      new ImgurResolver(),
      new XResolver(),
      new InstagramResolver(),
      new PinterestResolver(),
      new ArtStationResolver(),
      new DirectImageResolver() // Fallback
    ];
  }

  /**
   * Resolves an input URL string using the appropriate platform resolver.
   */
  async resolveUrl(urlStr: string): Promise<ResolveResult> {
    const cleanUrlStr = urlStr.trim();
    if (!cleanUrlStr) {
      return { success: false, error: 'Please enter a URL.' };
    }

    // 1. SSRF Guard
    const ssrfCheck = await validateUrlForSSRF(cleanUrlStr);
    if (!ssrfCheck.valid || !ssrfCheck.url) {
      return {
        success: false,
        error: ssrfCheck.error || 'URL validation failed.'
      };
    }

    const parsedUrl = ssrfCheck.url;

    // 2. Select matching resolver
    const resolver = this.resolvers.find(r => r.canHandle(parsedUrl)) || this.resolvers[this.resolvers.length - 1];

    try {
      return await resolver.resolve(parsedUrl);
    } catch (err: any) {
      return {
        success: false,
        error: `Resolver error: ${err.message || 'Failed to process URL.'}`,
        platform: resolver.name,
        canFallbackToDirectUpload: true
      };
    }
  }
}

export const globalResolverManager = new ResolverManager();
