import type { APIRoute } from 'astro';
import { calculateRegionalPrice } from '../../lib/pricing';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const typeId = url.searchParams.get('typeId');
  const country = url.searchParams.get('country');
  const currency = url.searchParams.get('currency');

  if (!typeId || !country) {
    return new Response(
      JSON.stringify({ error: 'Missing required query parameters: typeId and country' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await calculateRegionalPrice(typeId, country, currency || undefined);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('API calculate-price failed:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Pricing calculation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
