import type { APIRoute } from 'astro';
import { globalResolverManager } from '../../lib/resolvers/ResolverManager';
import { getSupabaseAdmin } from '../../lib/supabase';
import sharp from 'sharp';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const targetUrl = body?.url;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Target URL is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 1: Resolve the URL to get a direct image link
    const result = await globalResolverManager.resolveUrl(targetUrl);

    if (!result.success || !result.image) {
      return new Response(JSON.stringify(result), {
        status: 422, // Unprocessable Entity
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Fetch the resolved direct image
    const imgRes = await fetch(result.image.imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!imgRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to download image from ${result.platform}: ${imgRes.statusText}`,
        canFallbackToDirectUpload: true
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    let fileBuffer = Buffer.from(arrayBuffer);

    // Step 3: Convert to WebP via Sharp
    try {
      fileBuffer = await sharp(fileBuffer)
        .webp({ quality: 85 })
        .toBuffer();
    } catch (err) {
      console.error('[resolve-image] Sharp conversion failed:', err);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to process image data from ${result.platform}.`,
        canFallbackToDirectUpload: true
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 4: Upload to Supabase Storage
    const admin = getSupabaseAdmin();
    const bucketName = 'artworks';
    const storagePath = `artwork_resolved_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.webp`;

    const { error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('[resolve-image] Supabase Storage upload error:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: `Storage upload failed: ${uploadError.message}`,
        canFallbackToDirectUpload: true
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 5: Get public URL
    const { data: urlData } = admin.storage.from(bucketName).getPublicUrl(storagePath);
    
    // Update the result image with the Supabase URL instead of the remote URL
    const finalResult = {
      ...result,
      image: {
        ...result.image,
        supabaseUrl: urlData.publicUrl,
        storagePath
      }
    };

    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Server error resolving image URL.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
