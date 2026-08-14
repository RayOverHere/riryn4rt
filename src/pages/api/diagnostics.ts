/**
 * DEV-ONLY DIAGNOSTIC ENDPOINT
 * GET /api/diagnostics
 * Tests Supabase connection, Storage, and all DB operations.
 * Remove or gate this in production.
 */
import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';

export const GET: APIRoute = async () => {
  const results: Record<string, { status: 'PASS' | 'FAIL'; detail: string }> = {};

  let admin: ReturnType<typeof getSupabaseAdmin> | null = null;

  // 1. Check env vars
  const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  results['env_SUPABASE_URL'] = supabaseUrl
    ? { status: 'PASS', detail: supabaseUrl.replace(/https?:\/\//, '').slice(0, 40) }
    : { status: 'FAIL', detail: 'Missing SUPABASE_URL' };

  if (!supabaseAnonKey) {
    results['env_SUPABASE_ANON_KEY'] = { status: 'FAIL', detail: 'Missing SUPABASE_ANON_KEY' };
  } else if (supabaseAnonKey.startsWith('eyJ')) {
    // Legacy JWT format — valid
    results['env_SUPABASE_ANON_KEY'] = { status: 'PASS', detail: `JWT format (length: ${supabaseAnonKey.length})` };
  } else if (supabaseAnonKey.startsWith('sb_publishable_')) {
    // New Supabase publishable key format (2025+) — valid
    results['env_SUPABASE_ANON_KEY'] = { status: 'PASS', detail: `Publishable key format (length: ${supabaseAnonKey.length}) — valid for new Supabase projects` };
  } else {
    results['env_SUPABASE_ANON_KEY'] = {
      status: 'FAIL',
      detail: `Unrecognized key format: "${supabaseAnonKey.slice(0, 20)}..." — expected either JWT (eyJ...) or sb_publishable_ format`
    };
  }

  results['env_SUPABASE_SERVICE_ROLE_KEY'] = serviceKey
    ? { status: 'PASS', detail: `Set (length: ${serviceKey.length})` }
    : { status: 'FAIL', detail: 'Missing SUPABASE_SERVICE_ROLE_KEY' };

  // 2. Supabase admin client init
  try {
    admin = getSupabaseAdmin();
    results['supabase_client_init'] = { status: 'PASS', detail: 'Admin client created successfully' };
  } catch (e: any) {
    results['supabase_client_init'] = { status: 'FAIL', detail: e.message };
    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. DB Read - artworks table
  try {
    const { data, error } = await admin.from('artworks').select('id, title').limit(3);
    if (error) {
      results['db_read_artworks'] = { status: 'FAIL', detail: `${error.code}: ${error.message}` };
    } else {
      results['db_read_artworks'] = {
        status: 'PASS',
        detail: `Got ${data?.length ?? 0} rows. Sample: ${JSON.stringify(data?.map(r => r.title).slice(0, 2))}`
      };
    }
  } catch (e: any) {
    results['db_read_artworks'] = { status: 'FAIL', detail: e.message };
  }

  // 4. DB Read - artist_profile table (check actual columns)
  try {
    const { data, error } = await admin.from('artist_profile').select('*').limit(1);
    if (error) {
      results['db_read_artist_profile'] = { status: 'FAIL', detail: `${error.code}: ${error.message}` };
    } else if (!data || data.length === 0) {
      results['db_read_artist_profile'] = { status: 'FAIL', detail: 'Table is EMPTY — no profile row exists. Run seed.sql.' };
    } else {
      const cols = Object.keys(data[0]);
      results['db_read_artist_profile'] = {
        status: 'PASS',
        detail: `Found profile. Columns: ${cols.join(', ')}`
      };
    }
  } catch (e: any) {
    results['db_read_artist_profile'] = { status: 'FAIL', detail: e.message };
  }

  // 5. DB Insert test - artworks
  let testArtworkId: string | null = null;
  try {
    const { data, error } = await admin.from('artworks').insert({
      title: '__DIAGNOSTIC_TEST__',
      image_url: 'https://example.com/test.webp',
      display_order: 9999,
      is_hidden: true,
      is_published: false
    }).select('id').single();

    if (error) {
      results['db_insert_artwork'] = { status: 'FAIL', detail: `${error.code}: ${error.message}` };
    } else {
      testArtworkId = data?.id;
      results['db_insert_artwork'] = { status: 'PASS', detail: `Inserted test row with id: ${testArtworkId}` };
    }
  } catch (e: any) {
    results['db_insert_artwork'] = { status: 'FAIL', detail: e.message };
  }

  // 6. DB Update test
  if (testArtworkId) {
    try {
      const { error } = await admin.from('artworks')
        .update({ title: '__DIAGNOSTIC_TEST_UPDATED__' })
        .eq('id', testArtworkId);
      if (error) {
        results['db_update_artwork'] = { status: 'FAIL', detail: `${error.code}: ${error.message}` };
      } else {
        results['db_update_artwork'] = { status: 'PASS', detail: 'Update succeeded' };
      }
    } catch (e: any) {
      results['db_update_artwork'] = { status: 'FAIL', detail: e.message };
    }
  } else {
    results['db_update_artwork'] = { status: 'FAIL', detail: 'Skipped — insert failed' };
  }

  // 7. DB Delete test (cleanup)
  if (testArtworkId) {
    try {
      const { error } = await admin.from('artworks').delete().eq('id', testArtworkId);
      if (error) {
        results['db_delete_artwork'] = { status: 'FAIL', detail: `${error.code}: ${error.message}` };
      } else {
        results['db_delete_artwork'] = { status: 'PASS', detail: 'Deleted test row — cleanup complete' };
      }
    } catch (e: any) {
      results['db_delete_artwork'] = { status: 'FAIL', detail: e.message };
    }
  } else {
    results['db_delete_artwork'] = { status: 'FAIL', detail: 'Skipped — insert failed' };
  }

  // 8. Storage - list buckets
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) {
      results['storage_list_buckets'] = { status: 'FAIL', detail: `${error.message}` };
    } else {
      results['storage_list_buckets'] = {
        status: 'PASS',
        detail: `Buckets: ${(data || []).map(b => b.name).join(', ') || '(none yet)'}`
      };
    }
  } catch (e: any) {
    results['storage_list_buckets'] = { status: 'FAIL', detail: e.message };
  }

  // 9. Storage upload test — ensure bucket exists first
  try {
    // Auto-create the artworks bucket if it doesn't exist
    const { data: bucketList } = await admin.storage.listBuckets();
    const bucketExists = (bucketList || []).some(b => b.name === 'artworks');

    if (!bucketExists) {
      const { error: createErr } = await admin.storage.createBucket('artworks', {
        public: true,
        fileSizeLimit: 10485760 // 10MB
      });
      if (createErr) {
        results['storage_upload'] = { status: 'FAIL', detail: `Could not create bucket: ${createErr.message}` };
      } else {
        // Bucket just created — now upload test file
        const testContent = new TextEncoder().encode('diagnostic-test');
        const testPath = `__diagnostic_test_${Date.now()}.txt`;
        const { error: upErr } = await admin.storage.from('artworks').upload(testPath, testContent, { contentType: 'text/plain', upsert: true });
        if (upErr) {
          results['storage_upload'] = { status: 'FAIL', detail: upErr.message };
        } else {
          const { data: urlData } = admin.storage.from('artworks').getPublicUrl(testPath);
          await admin.storage.from('artworks').remove([testPath]);
          results['storage_upload'] = { status: 'PASS', detail: `Bucket created + uploaded OK. URL: ${urlData.publicUrl}` };
        }
      }
    } else {
      // Bucket already exists — just upload test file
      const testContent = new TextEncoder().encode('diagnostic-test');
      const testPath = `__diagnostic_test_${Date.now()}.txt`;
      const { error: upErr } = await admin.storage.from('artworks').upload(testPath, testContent, { contentType: 'text/plain', upsert: true });
      if (upErr) {
        results['storage_upload'] = { status: 'FAIL', detail: upErr.message };
      } else {
        const { data: urlData } = admin.storage.from('artworks').getPublicUrl(testPath);
        await admin.storage.from('artworks').remove([testPath]);
        results['storage_upload'] = { status: 'PASS', detail: `Uploaded. Public URL: ${urlData.publicUrl}` };
      }
    }
  } catch (e: any) {
    results['storage_upload'] = { status: 'FAIL', detail: e.message };
  }

  // 10. Auth - check if admin can read auth users (service role test)
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) {
      results['auth_service_role'] = { status: 'FAIL', detail: error.message };
    } else {
      results['auth_service_role'] = {
        status: 'PASS',
        detail: `Auth users accessible. Total: ${data.users.length} (first page)`
      };
    }
  } catch (e: any) {
    results['auth_service_role'] = { status: 'FAIL', detail: e.message };
  }

  // Summary
  const allPass = Object.values(results).every(r => r.status === 'PASS');
  const summary = {
    overall: allPass ? 'ALL PASS' : 'SOME FAILED',
    timestamp: new Date().toISOString(),
    results
  };

  return new Response(JSON.stringify(summary, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
