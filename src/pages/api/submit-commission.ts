import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase';
import { calculateRegionalPrice } from '../../lib/pricing';
import { validatePhone } from '../../lib/phone';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      client_name,
      client_email,
      client_country_code,
      client_phone,
      preferred_contact_method,
      commission_type_id,
      character_count = 1,
      description,
      reference_images = [],
      desired_deadline,
      is_commercial = false,
      additional_notes
    } = body;

    // 1. Core Field Validations
    if (!client_name || !client_email || !client_country_code || !client_phone || !preferred_contact_method || !commission_type_id || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Phone Validation
    const phoneVal = validatePhone(client_phone, client_country_code);
    if (!phoneVal.isValid) {
      return new Response(JSON.stringify({ error: `Phone validation error: ${phoneVal.error}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formattedPhone = phoneVal.phoneNumber || client_phone;

    // 3. Recalculate price server-side to prevent client-side price tampering
    const priceDetails = await calculateRegionalPrice(commission_type_id, client_country_code);
    
    // Formula: Base price for 1 character, +50% for each additional character.
    const charCountNum = Number(character_count);
    const charMultiplier = 1 + (charCountNum - 1) * 0.5;
    
    // Formula: +50% for commercial use
    const commercialMultiplier = is_commercial ? 1.5 : 1.0;
    
    const finalPrice = Math.round(priceDetails.finalPrice * charMultiplier * commercialMultiplier * 100) / 100;

    // 4. Save to database using Supabase Admin
    const admin = getSupabaseAdmin();
    const { data: requestData, error: dbError } = await admin
      .from('commission_requests')
      .insert({
        client_name,
        client_email,
        client_country_code: client_country_code.toUpperCase().trim(),
        client_phone: formattedPhone,
        preferred_contact_method,
        commission_type_id,
        character_count: charCountNum,
        description,
        reference_images,
        desired_deadline: desired_deadline ? desired_deadline : null,
        is_commercial,
        additional_notes,
        status: 'new',
        quoted_price: finalPrice,
        currency: priceDetails.currencyCode,
        pricing_version: '1.0',
        exchange_rate_used: priceDetails.exchangeRateUsed
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database insertion failed for commission request:', dbError);
      return new Response(JSON.stringify({ error: `Failed to save request: ${dbError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Generate WhatsApp Redirect URL
    let whatsappUrl = '';
    try {
      const { data: wsSetting } = await admin.from('site_settings').select('value').eq('key', 'whatsapp_number').maybeSingle();
      if (wsSetting && wsSetting.value?.number) {
        let phone = wsSetting.value.number;
        phone = phone.replace(/[^0-9]/g, '');
        
        const typeName = body.commission_type_name || 'Commission';
        const priceStr = priceDetails.currencyCode === 'IDR' ? `Rp${finalPrice.toLocaleString()}` : `$${finalPrice} ${priceDetails.currencyCode}`;
        
        const msg = `Hi Riryn! I'm ${client_name} from ${client_country_code}. I just submitted a commission request for "${typeName}". My preferred contact is ${preferred_contact_method}. The estimated quote was ${priceStr}. Can we discuss the details?`;
        whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      }
    } catch(e) {
      console.error('Error generating WA url:', e);
    }

    return new Response(JSON.stringify({ success: true, requestId: requestData.id, whatsappUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Submit commission API failed:', err);
    return new Response(JSON.stringify({ error: err.message || 'Server error submitting request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
