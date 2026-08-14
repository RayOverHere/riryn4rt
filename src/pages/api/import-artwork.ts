import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { globalResolverManager } from '../../lib/resolvers/ResolverManager';
import { validateUrlForSSRF } from '../../lib/resolvers/ssrfGuard';
import { getSupabaseAdmin } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { url: sourceUrl, title, description, tags, is_featured, display_order } = body || {};

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Source URL is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return new Response(JSON.stringify({ success: false, error: 'Artwork title is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 1: Resolve the image URL server-side
    const resolveRes = await globalResolverManager.resolveUrl(sourceUrl);

    if (!resolveRes.success || !resolveRes.image) {
      return new Response(JSON.stringify({
        success: false,
        error: resolveRes.error || 'Could not resolve image from the provided URL.',
        platform: resolveRes.platform
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resolvedImageUrl = resolveRes.image.imageUrl;

    // Step 2: SSRF check resolved image URL
    const ssrfCheck = await validateUrlForSSRF(resolvedImageUrl);
    if (!ssrfCheck.valid || !ssrfCheck.url) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, error: ssrfCheck.error || 'SSRF security check failed.' })
      };
    }

    // Step 3: Server-side Download
    const fetchRes = await fetch(ssrfCheck.url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*'
      }
    });

    if (!fetchRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to download image from resolved URL (HTTP ${fetchRes.status}).`
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const arrayBuf = await fetchRes.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuf);

    if (rawBuffer.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Downloaded image file is empty (0 bytes).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Server-Side Image Processing & WebP Conversion using Sharp
    let sharpInstance = sharp(rawBuffer);
    const meta = await sharpInstance.metadata();

    if (!meta.format) {
      return new Response(JSON.stringify({ success: false, error: 'Downloaded file is not a valid decodeable image.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Resize if larger than 2560px max dimension (preserve aspect ratio, do not upscale small images)
    const MAX_DIM = 2560;
    if ((meta.width && meta.width > MAX_DIM) || (meta.height && meta.height > MAX_DIM)) {
      sharpInstance = sharpInstance.resize({
        width: MAX_DIM,
        height: MAX_DIM,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to WebP format with quality 85
    const webpBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer();

    // Step 5: Upload to Supabase Storage 'artworks' bucket
    const admin = getSupabaseAdmin();
    const bucketName = 'artworks';

    // Ensure bucket exists
    try {
      const { data: buckets } = await admin.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);
      if (!bucketExists) {
        await admin.storage.createBucket(bucketName, { public: true, fileSizeLimit: 15728640 });
      }
    } catch {
      // Ignore if exists
    }

    const storagePath = `artwork_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.webp`;
    const { error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(storagePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('[import-artwork] Supabase Storage upload error:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: `Supabase Storage upload failed: ${uploadError.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: urlData } = admin.storage.from(bucketName).getPublicUrl(storagePath);
    const publicStorageUrl = urlData.publicUrl;

    // Step 6: Create PostgreSQL artwork record
    const { data: dbData, error: dbError } = await admin
      .from('artworks')
      .insert({
        title: title.trim(),
        description: description ? description.trim() : null,
        image_url: publicStorageUrl,
        display_order: parseInt(display_order) || 0,
        is_featured: Boolean(is_featured),
        is_published: true,
        is_hidden: false,
        tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])
      })
      .select('*')
      .single();

    if (dbError) {
      console.error('[import-artwork] PostgreSQL artwork insert failed:', dbError);
      // Cleanup uploaded file from storage on DB failure
      await admin.storage.from(bucketName).remove([storagePath]);

      return new Response(JSON.stringify({
        success: false,
        error: `Database insertion failed: ${dbError.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[import-artwork] SUCCESS! Artwork created: ${dbData.id} (${dbData.title})`);

    return new Response(JSON.stringify({
      success: true,
      artwork: dbData,
      storageUrl: publicStorageUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[import-artwork] Unexpected error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Import artwork failed.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
