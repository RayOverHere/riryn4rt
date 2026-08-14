import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';

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

    // 1. Validation: Max 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File size exceeds maximum limit of 5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Validation: Image only
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Only image files (JPEG, PNG, WEBP, GIF) are allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Initialize Admin Supabase
    const admin = getSupabaseAdmin();
    
    // Create unique filename
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${Date.now()}-${crypto.randomUUID()}-${cleanFileName}`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to 'commissions-references' bucket
    const { data: uploadData, error: uploadError } = await admin.storage
      .from('commissions-references')
      .upload(path, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      // Fallback: If bucket does not exist, it might fail. Log details.
      console.error('Supabase Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: `Storage upload failed: ${uploadError.message}. Make sure the 'commissions-references' bucket exists in Supabase.` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get public URL
    const { data: urlData } = admin.storage
      .from('commissions-references')
      .getPublicUrl(path);

    return new Response(JSON.stringify({ url: urlData.publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Upload reference failed:', err);
    return new Response(JSON.stringify({ error: err.message || 'File upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
