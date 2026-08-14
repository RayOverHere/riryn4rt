import sharp from 'sharp';
import { validateUrlForSSRF } from './ssrfGuard';
import type { ResolvedImage } from './types';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Server-side image fetcher and validator.
 * Downloads image buffer safely, enforces size limits, and inspects image metadata with sharp.
 */
export async function fetchAndValidateImage(
  targetUrl: string,
  platformName: string = 'Direct Link'
): Promise<{ success: boolean; image?: ResolvedImage; error?: string }> {
  // 1. SSRF Guard
  const ssrfCheck = await validateUrlForSSRF(targetUrl);
  if (!ssrfCheck.valid || !ssrfCheck.url) {
    return { success: false, error: ssrfCheck.error || 'URL failed security validation.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const res = await fetch(ssrfCheck.url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, error: `HTTP error ${res.status}: Failed to retrieve image from target URL.` };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // Verify it's an actual image content type
    if (!contentType.includes('image/') && !contentType.includes('application/octet-stream')) {
      return { success: false, error: `URL returned non-image Content-Type: "${contentType}". Expected image/jpeg, image/png, image/webp, etc.` };
    }

    const contentLengthStr = res.headers.get('content-length');
    if (contentLengthStr) {
      const contentLength = parseInt(contentLengthStr, 10);
      if (contentLength > MAX_IMAGE_SIZE) {
        return { success: false, error: `Image size (${(contentLength / 1024 / 1024).toFixed(1)} MB) exceeds maximum allowed size of 15MB.` };
      }
    }

    // Read response body arrayBuffer
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_IMAGE_SIZE) {
      return { success: false, error: `Image size (${(buffer.length / 1024 / 1024).toFixed(1)} MB) exceeds maximum allowed size of 15MB.` };
    }

    if (buffer.length === 0) {
      return { success: false, error: 'Target URL returned an empty image file (0 bytes).' };
    }

    // Parse image metadata using sharp
    let sharpMeta: sharp.Metadata;
    try {
      sharpMeta = await sharp(buffer).metadata();
    } catch {
      return { success: false, error: 'File content could not be decoded as a valid image format.' };
    }

    if (!sharpMeta.format || !sharpMeta.width || !sharpMeta.height) {
      return { success: false, error: 'Could not inspect image dimensions or format.' };
    }

    const formatUpper = sharpMeta.format.toUpperCase();

    return {
      success: true,
      image: {
        imageUrl: targetUrl,
        sourcePlatform: platformName,
        width: sharpMeta.width,
        height: sharpMeta.height,
        sizeBytes: buffer.length,
        mimeType: contentType || `image/${sharpMeta.format}`,
        format: formatUpper
      }
    };

  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Request timed out while trying to fetch the image.' };
    }
    return { success: false, error: `Failed to fetch image: ${err.message}` };
  }
}

/**
 * Utility to extract og:image or twitter:image from HTML string safely
 */
export function extractMetaImage(html: string): string | null {
  // Check og:image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1].replace(/&amp;/g, '&');
  }

  // Check twitter:image
  const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  if (twMatch && twMatch[1]) {
    return twMatch[1].replace(/&amp;/g, '&');
  }

  return null;
}
