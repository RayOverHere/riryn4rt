import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0];
const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

async function runSQL(label, sql) {
  console.log(`\n🔄 Running: ${label}...`);
  const res = await fetch(managementApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const pgMetaUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    const fallback = await fetch(pgMetaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!fallback.ok) {
      const errText = await res.text();
      console.error(`❌ ${label} FAILED: ${res.status} - ${errText}`);
      return false;
    }
  }

  console.log(`✅ ${label} — OK`);
  return true;
}

const sql = readFileSync(join(__dirname, 'migration_currencies.sql'), 'utf-8');
await runSQL('Currencies Migration', sql);
