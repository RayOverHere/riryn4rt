-- 1. Insert specific pricing regions
insert into pricing_regions (id, name, currency_code, regional_multiplier, exchange_rate, rounding_method) values
('33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5', 'Japan', 'JPY', 1.00, 100.0, 'nearest_100'),
('43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6', 'South Korea', 'KRW', 1.00, 11.0, 'nearest_100'),
('53c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c7', 'Malaysia', 'MYR', 1.00, 3200.0, 'nearest_5'),
('63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8', 'Philippines', 'PHP', 1.00, 270.0, 'nearest_5'),
('73c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c9', 'Thailand', 'THB', 1.00, 430.0, 'nearest_10'),
('83c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ca', 'Australia', 'AUD', 1.00, 10000.0, 'nearest_5'),
('93c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cb', 'Canada', 'CAD', 1.00, 11000.0, 'nearest_5'),
('a3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cc', 'New Zealand', 'NZD', 1.00, 9000.0, 'nearest_5'),
('b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cd', 'China', 'CNY', 1.00, 2100.0, 'nearest_5'),
('c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ce', 'Hong Kong', 'HKD', 1.00, 1900.0, 'nearest_5'),
('d3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cf', 'Taiwan', 'TWD', 1.00, 470.0, 'nearest_10'),
('e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d0', 'India', 'INR', 1.00, 180.0, 'nearest_10'),
('f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d1', 'Switzerland', 'CHF', 1.00, 17000.0, 'nearest_5')
on conflict (name) do update set 
  currency_code = EXCLUDED.currency_code,
  exchange_rate = EXCLUDED.exchange_rate,
  rounding_method = EXCLUDED.rounding_method;

-- 2. Update existing countries to point to their specific regions instead of Default International
update countries set pricing_region_id = '33c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c5' where code = 'JP';
update countries set pricing_region_id = '43c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c6' where code = 'KR';
update countries set pricing_region_id = '53c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c7' where code = 'MY';
update countries set pricing_region_id = '63c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c8' where code = 'PH';
update countries set pricing_region_id = '73c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7c9' where code = 'TH';
update countries set pricing_region_id = '83c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ca' where code = 'AU';
update countries set pricing_region_id = '93c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cb' where code = 'CA';
update countries set pricing_region_id = 'a3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cc' where code = 'NZ';

-- Add additional missing countries
insert into countries (code, name, pricing_region_id, phone_prefix) values
('CN', 'China', 'b3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cd', '+86'),
('HK', 'Hong Kong', 'c3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7ce', '+852'),
('TW', 'Taiwan', 'd3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7cf', '+886'),
('IN', 'India', 'e3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d0', '+91'),
('CH', 'Switzerland', 'f3c00c0f-d4e5-4d7a-8f9f-0c4e09f5a7d1', '+41')
on conflict (code) do nothing;
