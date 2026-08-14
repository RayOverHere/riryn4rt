import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const regions = [
    { id: '33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', name: 'Japan', currency_code: 'JPY', regional_multiplier: 1.00, exchange_rate: 100.0, rounding_method: 'nearest_100' },
    { id: '43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6', name: 'South Korea', currency_code: 'KRW', regional_multiplier: 1.00, exchange_rate: 11.0, rounding_method: 'nearest_100' },
    { id: '53c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c7', name: 'Malaysia', currency_code: 'MYR', regional_multiplier: 1.00, exchange_rate: 3200.0, rounding_method: 'nearest_5' },
    { id: '63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8', name: 'Philippines', currency_code: 'PHP', regional_multiplier: 1.00, exchange_rate: 270.0, rounding_method: 'nearest_5' },
    { id: '73c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c9', name: 'Thailand', currency_code: 'THB', regional_multiplier: 1.00, exchange_rate: 430.0, rounding_method: 'nearest_10' },
    { id: '83c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ca', name: 'Australia', currency_code: 'AUD', regional_multiplier: 1.00, exchange_rate: 10000.0, rounding_method: 'nearest_5' },
    { id: '93c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cb', name: 'Canada', currency_code: 'CAD', regional_multiplier: 1.00, exchange_rate: 11000.0, rounding_method: 'nearest_5' },
    { id: 'a3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cc', name: 'New Zealand', currency_code: 'NZD', regional_multiplier: 1.00, exchange_rate: 9000.0, rounding_method: 'nearest_5' },
    { id: 'b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cd', name: 'China', currency_code: 'CNY', regional_multiplier: 1.00, exchange_rate: 2100.0, rounding_method: 'nearest_5' },
    { id: 'c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ce', name: 'Hong Kong', currency_code: 'HKD', regional_multiplier: 1.00, exchange_rate: 1900.0, rounding_method: 'nearest_5' },
    { id: 'd3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cf', name: 'Taiwan', currency_code: 'TWD', regional_multiplier: 1.00, exchange_rate: 470.0, rounding_method: 'nearest_10' },
    { id: 'e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d0', name: 'India', currency_code: 'INR', regional_multiplier: 1.00, exchange_rate: 180.0, rounding_method: 'nearest_10' },
    { id: 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d1', name: 'Switzerland', currency_code: 'CHF', regional_multiplier: 1.00, exchange_rate: 17000.0, rounding_method: 'nearest_5' }
  ];

  for (const r of regions) {
    const { error } = await supabase.from('pricing_regions').upsert(r, { onConflict: 'name' });
    if (error) console.error('Region error:', r.name, error.message);
  }

  console.log('✅ Pricing regions upserted');

  const countryUpdates = [
    { code: 'JP', regionId: '33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5' },
    { code: 'KR', regionId: '43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6' },
    { code: 'MY', regionId: '53c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c7' },
    { code: 'PH', regionId: '63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8' },
    { code: 'TH', regionId: '73c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c9' },
    { code: 'AU', regionId: '83c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ca' },
    { code: 'CA', regionId: '93c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cb' },
    { code: 'NZ', regionId: 'a3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cc' }
  ];

  for (const c of countryUpdates) {
    const { error } = await supabase.from('countries').update({ pricing_region_id: c.regionId }).eq('code', c.code);
    if (error) console.error('Country update error:', c.code, error.message);
  }
  console.log('✅ Countries updated');

  const newCountries = [
    { code: 'CN', name: 'China', pricing_region_id: 'b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cd', phone_prefix: '+86' },
    { code: 'HK', name: 'Hong Kong', pricing_region_id: 'c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ce', phone_prefix: '+852' },
    { code: 'TW', name: 'Taiwan', pricing_region_id: 'd3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cf', phone_prefix: '+886' },
    { code: 'IN', name: 'India', pricing_region_id: 'e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d0', phone_prefix: '+91' },
    { code: 'CH', name: 'Switzerland', pricing_region_id: 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d1', phone_prefix: '+41' }
  ];

  for (const c of newCountries) {
    const { error } = await supabase.from('countries').upsert(c, { onConflict: 'code' });
    if (error) console.error('Country upsert error:', c.code, error.message);
  }
  console.log('✅ New countries upserted');
}

main().catch(console.error);
