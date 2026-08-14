import { supabase } from './supabase';

export interface PricingResult {
  commissionTypeId: string;
  countryCode: string;
  regionName: string;
  currencyCode: string;
  originalPrice: number; // base price in IDR
  regionalMultiplier: number;
  exchangeRateUsed: number;
  isOverride: boolean;
  finalPrice: number; // rounded price in target currency
}

/**
 * Rounds a price based on the region's rounding method
 */
export function roundPrice(price: number, method: string): number {
  if (method === 'nearest_5') {
    return Math.max(5, Math.round(price / 5) * 5);
  }
  if (method === 'nearest_10') {
    return Math.max(10, Math.round(price / 10) * 10);
  }
  if (method === 'nearest_10000') {
    return Math.max(10000, Math.round(price / 10000) * 10000);
  }
  return Math.round(price * 100) / 100; // default to 2 decimal places
}

/**
 * Calculates regional price for a single commission type and country, or specific currency
 */
export async function calculateRegionalPrice(
  commissionTypeId: string,
  countryCode: string,
  targetCurrencyCode?: string
): Promise<PricingResult> {
  const normalizedCountryCode = countryCode.toUpperCase().trim();
  const normalizedTargetCurrency = targetCurrencyCode?.toUpperCase().trim();

  try {
    let region: any;
    let fallbackToDefault = false;

    // If target currency is specified, try to find a region matching it
    if (normalizedTargetCurrency) {
      const { data: currencyRegion, error: currencyError } = await supabase
        .from('pricing_regions')
        .select('*')
        .eq('currency_code', normalizedTargetCurrency)
        .limit(1)
        .maybeSingle();

      if (!currencyError && currencyRegion) {
        region = currencyRegion;
      }
    }

    // If no region found by currency, or no currency provided, fetch by country
    if (!region) {
      let { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('name, pricing_region_id, pricing_regions(*)')
        .eq('code', normalizedCountryCode)
        .maybeSingle();

      if (countryError || !countryData) {
        fallbackToDefault = true;
      } else {
        region = countryData.pricing_regions;
      }
    }

    // Fallback: If country is not found or error, look up "Default International" region
    if (fallbackToDefault || !region) {
      const { data: defaultRegion, error: regionError } = await supabase
        .from('pricing_regions')
        .select('*')
        .eq('name', 'Default International')
        .maybeSingle();

      if (regionError || !defaultRegion) {
        // Absolute fallback if database is empty or unavailable
        return {
          commissionTypeId,
          countryCode: normalizedCountryCode,
          regionName: 'Fallback',
          currencyCode: normalizedTargetCurrency || 'USD',
          originalPrice: 150000,
          regionalMultiplier: 1.0,
          exchangeRateUsed: 15000,
          isOverride: false,
          finalPrice: 10
        };
      }
      region = defaultRegion;
    }

    // 2. Fetch the commission type base price
    const { data: commissionType, error: commError } = await supabase
      .from('commission_types')
      .select('base_price_idr')
      .eq('id', commissionTypeId)
      .single();

    if (commError || !commissionType) {
      throw new Error(`Commission type not found: ${commissionTypeId}`);
    }

    const basePriceIdr = Number(commissionType.base_price_idr);

    // 3. Check for manual override for this specific type and region
    const { data: override, error: overrideError } = await supabase
      .from('price_overrides')
      .select('override_price')
      .eq('commission_type_id', commissionTypeId)
      .eq('pricing_region_id', region.id)
      .single();

    if (override && !overrideError) {
      return {
        commissionTypeId,
        countryCode: normalizedCountryCode,
        regionName: region.name,
        currencyCode: region.currency_code,
        originalPrice: basePriceIdr,
        regionalMultiplier: Number(region.regional_multiplier),
        exchangeRateUsed: Number(region.exchange_rate),
        isOverride: true,
        finalPrice: Number(override.override_price)
      };
    }

    // 4. Calculate price using regional formula
    const adjustedPriceIdr = basePriceIdr * Number(region.regional_multiplier);
    const convertedPrice = adjustedPriceIdr / Number(region.exchange_rate);
    const finalPrice = roundPrice(convertedPrice, region.rounding_method);

    return {
      commissionTypeId,
      countryCode: normalizedCountryCode,
      regionName: region.name,
      currencyCode: region.currency_code,
      originalPrice: basePriceIdr,
      regionalMultiplier: Number(region.regional_multiplier),
      exchangeRateUsed: Number(region.exchange_rate),
      isOverride: false,
      finalPrice
    };
  } catch (err) {
    console.error('Pricing calculation failed:', err);
    // Return absolute safety fallback
    return {
      commissionTypeId,
      countryCode: normalizedCountryCode,
      regionName: 'Fallback Safety',
      currencyCode: 'USD',
      originalPrice: 150000,
      regionalMultiplier: 1.0,
      exchangeRateUsed: 15000,
      isOverride: false,
      finalPrice: 10
    };
  }
}

/**
 * Fetch latest exchange rates from open API and update regions in database.
 * Base currency is IDR.
 */
export async function syncExchangeRates(supabaseAdminClient: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/IDR');
    if (!res.ok) {
      throw new Error(`Failed to fetch exchange rates: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.result !== 'success' || !data.rates) {
      throw new Error('Exchange rate API returned unsuccessful response');
    }

    const rates = data.rates;

    // Fetch all pricing regions
    const { data: regions, error: regionsError } = await supabaseAdminClient
      .from('pricing_regions')
      .select('*');

    if (regionsError || !regions) {
      throw new Error(`Failed to fetch regions from DB: ${regionsError?.message}`);
    }

    let updatedCount = 0;

    for (const region of regions) {
      const currency = region.currency_code;
      if (currency === 'IDR') {
        // IDR base is always 1.0
        await supabaseAdminClient
          .from('pricing_regions')
          .update({
            exchange_rate: 1.000000,
            last_exchange_rate_update: new Date().toISOString()
          })
          .eq('id', region.id);
        continue;
      }

      // API returns 1 IDR = X foreign currency (e.g. 0.0000627 USD)
      // Our exchange_rate is the value of 1 unit of foreign currency in IDR (e.g. 15948 IDR for 1 USD)
      // So exchange_rate = 1 / rates[currency]
      const rateToIdr = rates[currency];
      if (rateToIdr) {
        const valueInIdr = 1 / rateToIdr;

        const { error: updateError } = await supabaseAdminClient
          .from('pricing_regions')
          .update({
            exchange_rate: valueInIdr,
            last_exchange_rate_update: new Date().toISOString()
          })
          .eq('id', region.id);

        if (!updateError) {
          updatedCount++;
        } else {
          console.error(`Failed to update exchange rate for region ${region.name}:`, updateError);
        }
      }
    }

    return {
      success: true,
      message: `Successfully synchronized ${updatedCount} regional exchange rates using IDR base.`
    };
  } catch (err: any) {
    console.error('Exchange rate synchronization error:', err);
    return {
      success: false,
      message: err.message || 'Unknown error occurred during exchange rate sync.'
    };
  }
}
