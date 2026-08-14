/**
 * Supabase Database Setup Script
 * Runs schema.sql + migration + seed.sql against your Supabase project
 * using the Management API (service role key).
 *
 * Usage:
 *   node db/setup.mjs
 *
 * Requirements:
 *   - .env must have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Extract project ref from URL
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
    // Try Supabase REST fallback (pg-meta)
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

const __dirname = dirname(fileURLToPath(import.meta.url));

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
const migration = readFileSync(join(__dirname, 'migration_add_profile_columns.sql'), 'utf-8');
const seed = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');

console.log('🚀 Supabase Database Setup');
console.log(`   Project: ${projectRef}`);
console.log('   ⚠️  This will DROP and recreate all tables!\n');

await runSQL('Schema (drop + recreate tables + RLS)', schema);
await runSQL('Migration (add missing profile columns)', migration);
await runSQL('Seed data (insert initial rows)', seed);

console.log('\n✅ Setup complete! Your Supabase database is ready.');
console.log('   Visit http://localhost:4321/api/diagnostics to verify.');
