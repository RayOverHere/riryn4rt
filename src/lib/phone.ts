import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  phoneNumber?: string; // formatted in E.164
  country?: string; // ISO country code, e.g. 'US', 'ID'
  error?: string;
}

/**
 * Validates a phone number and detects its country code
 */
export function validatePhone(phone: string, defaultCountry: string = 'US'): PhoneValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required' };
  }

  try {
    // Attempt to parse. If it starts with + we don't need a default country.
    // If not, we use the default country selected in the form.
    const cleanPhone = phone.trim();
    const hasPlus = cleanPhone.startsWith('+');
    const lookupCountry = hasPlus ? undefined : (defaultCountry.toUpperCase() as CountryCode);

    const parsed = parsePhoneNumberFromString(cleanPhone, lookupCountry);

    if (!parsed) {
      return { isValid: false, error: 'Invalid phone number format' };
    }

    if (!parsed.isValid()) {
      return { isValid: false, error: `Invalid number for country: ${parsed.country || defaultCountry}` };
    }

    return {
      isValid: true,
      phoneNumber: parsed.format('E.164'),
      country: parsed.country
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || 'Error parsing phone number'
    };
  }
}
