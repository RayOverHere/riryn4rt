import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';
import sharp from 'sharp';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validation: Max 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File size exceeds maximum limit of 10MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let admin: ReturnType<typeof getSupabaseAdmin>;
    try {
      admin = getSupabaseAdmin();
    } catch (e: any) {
      console.error('[upload-artwork] Admin client init failed:', e.message);
      return new Response(JSON.stringify({ error: `Server configuration error: ${e.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const bucketName = 'artworks';

    // Ensure bucket exists
    try {
      const { data: buckets, error: listErr } = await admin.storage.listBuckets();
      if (listErr) {
        console.error('[upload-artwork] Could not list buckets:', listErr);
      } else {
        const bucketExists = buckets?.some(b => b.name === bucketName);
        if (!bucketExists) {
          const { error: createErr } = await admin.storage.createBucket(bucketName, { public: true });
          if (createErr) {
            console.error('[upload-artwork] Bucket creation error:', createErr);
          }
        }
      }
    } catch (e) {
      console.error('[upload-artwork] Bucket check failed:', e);
    }

    const arrayBuffer = await file.arrayBuffer();
    let fileBuffer = Buffer.from(arrayBuffer);

    // Convert to WebP using sharp if it's an image
    if (file.type.startsWith('image/')) {
      try {
        fileBuffer = await sharp(fileBuffer)
          .webp({ quality: 85 })
          .toBuffer();
      } catch (err) {
        console.error('[upload-artwork] Sharp conversion failed:', err);
        // Fallback to original buffer if sharp fails
      }
    }

    // Create unique storage path
    const storagePath = `artwork_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.webp`;

    // Step 1: Upload to Storage
    const { error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('[upload-artwork] Supabase Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Get public URL
    const { data: urlData } = admin.storage.from(bucketName).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    console.log(`[upload-artwork] Storage upload succeeded: ${storagePath} -> ${publicUrl}`);

    return new Response(JSON.stringify({ url: publicUrl, storagePath }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[upload-artwork] Unexpected error:', err);
    return new Response(JSON.stringify({ error: err.message || 'File upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
