import React, { useState, useEffect } from 'react';
import { validatePhone } from '../../lib/phone';
import CountrySelector from './CountrySelector';

export interface CommissionType {
  id: string;
  title: string;
  description: string;
  base_price_idr: number;
  turnaround_time: string;
  revision_policy: string;
  commercial_usage_policy: string;
  is_active: boolean;
  display_order: number;
}

export interface Country {
  code: string;
  name: string;
  phone_prefix: string;
  currency_code?: string;
}

interface ModuleProps {
  commissionTypes: CommissionType[];
  countries: Country[];
}

export default function CommissionModule({ commissionTypes, countries }: ModuleProps) {
  const [selectedCountry, setSelectedCountry] = useState('US');

  const [stylePrices, setStylePrices] = useState<Record<string, { price: number; currency: string; isOverride: boolean }>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('email');
  const [selectedType, setSelectedType] = useState(commissionTypes[0]?.id || '');
  const [isCommercial, setIsCommercial] = useState(false);

  const [phoneError, setPhoneError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!selectedCountry) return;

    const fetchAllPrices = async () => {
      setIsLoadingPrices(true);
      const newPrices: Record<string, { price: number; currency: string; isOverride: boolean }> = {};
      
      try {
        await Promise.all(
          commissionTypes.map(async (type) => {
            const url = `/api/calculate-price?typeId=${type.id}&country=${selectedCountry}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              newPrices[type.id] = {
                price: data.finalPrice,
                currency: data.currencyCode,
                isOverride: data.isOverride
              };
            }
          })
        );
        setStylePrices(newPrices);
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchAllPrices();
  }, [selectedCountry, commissionTypes]);

  useEffect(() => {
    const selected = countries.find((c) => c.code === selectedCountry);
    if (selected && selected.phone_prefix) {
      if (!clientPhone || clientPhone.startsWith('+')) {
        setClientPhone(selected.phone_prefix + ' ');
      }
    }
  }, [selectedCountry]);

  const handleSelectStyle = (typeId: string) => {
    setSelectedType(typeId);
    const formEl = document.getElementById('request-form-heading');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentPricing = stylePrices[selectedType];
  const activeBasePrice = currentPricing?.price || 0;
  const activeCurrency = currentPricing?.currency || 'USD';
  
  const commercialMultiplier = isCommercial ? 1.5 : 1.0;
  const finalEstimate = Math.round(activeBasePrice * commercialMultiplier * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setPhoneError('');
    setIsSubmitting(true);

    const phoneVal = validatePhone(clientPhone, selectedCountry);
    if (!phoneVal.isValid) {
      setPhoneError(phoneVal.error || 'Invalid phone number');
      setIsSubmitting(false);
      return;
    }

    try {
      const typeName = commissionTypes.find(c => c.id === selectedType)?.title || 'Commission';
      
      const res = await fetch('/api/submit-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          client_country_code: selectedCountry,
          client_phone: clientPhone,
          preferred_contact_method: contactMethod,
          commission_type_id: selectedType,
          commission_type_name: typeName,
          character_count: 1, // Defaulting to 1 to bypass DB constraint
          description: 'Details will be discussed via direct messaging/WhatsApp.', // Dummy required field
          is_commercial: isCommercial
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      if (data.whatsappUrl) {
        window.location.href = data.whatsappUrl;
      } else {
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCatalogPriceString = (typeId: string) => {
    const data = stylePrices[typeId];
    if (isLoadingPrices || !data) return 'Calculating...';
    if (data.currency === 'IDR') {
      return `Rp${data.price.toLocaleString()}`;
    }
    return `$${data.price} ${data.currency}`;
  };

  const getStyleImage = (idx: number) => {
    const images = [
      '/images/gallery/strawberry-dream.svg',
      '/images/gallery/bunny-picnic.svg',
      '/images/gallery/magical-library.svg',
      '/images/gallery/tea-party.svg'
    ];
    return images[idx % images.length];
  };

  if (submitSuccess) {
    return (
      <div className="cute-card p-8 bg-white max-w-2xl mx-auto text-center flex flex-col items-center gap-6 animate-fade-in my-12">
        <div className="text-6xl animate-bounce">💖</div>
        <h2 className="text-3xl font-display text-darkpink-deep">Request Submitted!</h2>
        <p className="text-darkpink-muted font-medium text-lg leading-relaxed">
          Thank you so much, {clientName}! Your commission request has been received. 
          I will review the details and get back to you via your preferred contact method (<strong>{contactMethod}</strong>) to discuss details!
        </p>
        <a href="/" className="cute-btn text-lg mt-4">
          Return to Studio Home 🍓
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      
      {/* Location Picker */}
      <div className="bg-blush border-3 border-babypink rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-4 max-w-2xl mx-auto w-full shadow-[0_4px_0_var(--color-candy)]">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-3xl shrink-0">🌍</span>
          <div>
            <h3 className="font-display font-bold text-darkpink-deep text-lg sm:text-xl leading-tight">Your Location</h3>
            <p className="text-xs text-darkpink-muted font-semibold mt-1 max-w-[200px]">Select your country to see region-adjusted pricing and currency.</p>
          </div>
        </div>
        
        <div className="w-full sm:w-64">
          <CountrySelector 
            countries={countries}
            selectedCountryCode={selectedCountry}
            onChange={setSelectedCountry}
          />
        </div>
      </div>

      {/* Commission Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {commissionTypes.map((type, idx) => (
          <div key={type.id} className="cute-card bg-white p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6">
            <div className="w-full sm:w-40 aspect-square rounded-2xl overflow-hidden bg-cream border-2 border-candy relative flex-shrink-0 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none">
              <img
                src={getStyleImage(idx)}
                alt={type.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-between flex-grow gap-4">
              <div className="flex flex-col gap-1.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start">
                  <span className="text-xs font-bold text-roseaccent bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider">
                    🌸 Turnaround: {type.turnaround_time}
                  </span>
                </div>
                <h3 className="text-2xl font-display text-darkpink-deep font-bold mt-1">{type.title}</h3>
                <p className="text-sm text-darkpink-muted font-medium leading-relaxed">{type.description}</p>
                <div className="text-xs text-darkpink-muted mt-2 space-y-1">
                  <p><strong>Revisions:</strong> {type.revision_policy}</p>
                  <p><strong>Commercial:</strong> {type.commercial_usage_policy}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-candy pt-4 mt-2 gap-4 sm:gap-0">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[10px] font-bold text-darkpink-muted uppercase tracking-wider">Base Rate</span>
                  <span className="text-2xl font-display text-roseaccent font-bold">
                    {getCatalogPriceString(type.id)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectStyle(type.id)}
                  className="cute-btn-secondary text-sm py-2 px-6 sm:px-4 cursor-pointer w-full sm:w-auto shadow-md"
                >
                  Request Style ✨
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-4 text-babypink select-none overflow-hidden">
        <span>🌸</span>
        <hr className="w-16 sm:w-24 border-babypink border-2 rounded-full" />
        <span>🍓</span>
        <hr className="w-16 sm:w-24 border-babypink border-2 rounded-full" />
        <span>🌸</span>
      </div>

      {/* Simplified Request Form */}
      <div>
        <h2 id="request-form-heading" className="text-2xl sm:text-3xl font-display text-darkpink-deep text-center mb-2">
          Request Quote
        </h2>
        <p className="text-darkpink-muted text-center max-w-md mx-auto font-medium mb-8 sm:mb-12 text-sm sm:text-base px-4">
          Fill in your contact details below. You will be redirected to WhatsApp to discuss your character references and details!
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Invoice Summary */}
          <div className="lg:col-span-4 sticky top-6 flex flex-col gap-6">
            <div className="cute-card p-5 sm:p-6 bg-white flex flex-col gap-4">
              <h3 className="text-xl font-display text-darkpink-deep border-b border-candy pb-2">Quote Summary</h3>
              
              <div className="flex flex-col gap-3 font-semibold text-sm">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-darkpink-muted shrink-0">Selected Style:</span>
                  <span className="text-darkpink-deep text-right">
                    {commissionTypes.find((c) => c.id === selectedType)?.title || 'None Selected'}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-darkpink-muted shrink-0">Base Price:</span>
                  <span className="text-darkpink-deep text-right">
                    {isLoadingPrices ? '...' : (activeCurrency === 'IDR' ? `Rp${activeBasePrice.toLocaleString()}` : `$${activeBasePrice} ${activeCurrency}`)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-darkpink-muted shrink-0">Commercial:</span>
                  <span className="text-darkpink-deep text-right">{isCommercial ? 'Yes (+50%)' : 'No (+0%)'}</span>
                </div>

                {currentPricing?.isOverride && (
                  <div className="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-100 mt-1">
                    ⭐ Custom override rate applied.
                  </div>
                )}
              </div>

              <div className="border-t border-candy pt-4 flex flex-col gap-1 items-end">
                <span className="text-xs font-bold text-darkpink-muted uppercase tracking-wider">Estimated Total</span>
                <span className="text-3xl font-display text-roseaccent font-bold">
                  {isLoadingPrices ? '...' : (activeCurrency === 'IDR' ? `Rp${finalEstimate.toLocaleString()}` : `$${finalEstimate} ${activeCurrency}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-8 cute-card p-5 sm:p-8 bg-white flex flex-col gap-5 sm:gap-6">
            
            {submitError && (
              <div className="p-4 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-2xl font-semibold text-sm">
                🚨 {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-display font-semibold text-darkpink-deep">Your Name <span className="text-roseaccent">*</span></label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Lulu"
                  className="cute-input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-display font-semibold text-darkpink-deep">Email Address <span className="text-roseaccent">*</span></label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. lulu@example.com"
                  className="cute-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-display font-semibold text-darkpink-deep">Phone Number <span className="text-roseaccent">*</span></label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="e.g. +62 812 3456 789"
                  className={`cute-input ${phoneError ? 'border-red-400' : ''}`}
                />
                {phoneError && <span className="text-xs font-semibold text-red-500">{phoneError}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-display font-semibold text-darkpink-deep">Preferred Contact <span className="text-roseaccent">*</span></label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="cute-input cursor-pointer"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="discord">Discord</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 justify-end pt-2">
              <div className="flex items-center gap-3 p-4 bg-blush border border-babypink rounded-2xl cursor-pointer" onClick={() => setIsCommercial(!isCommercial)}>
                <input
                  type="checkbox"
                  id="comm-check-form"
                  checked={isCommercial}
                  onChange={(e) => setIsCommercial(e.target.checked)}
                  className="w-5 h-5 accent-roseaccent rounded cursor-pointer pointer-events-none"
                />
                <label className="font-display font-bold text-darkpink-deep cursor-pointer text-sm sm:text-base select-none pointer-events-none">
                  Check if for Commercial Usage (e.g. Merch, Streaming, Promo)
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-candy flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="cute-btn text-base sm:text-lg py-3 px-6 sm:px-8 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
              >
                {isSubmitting ? 'Generating Quote...' : 'Submit & Discuss on WhatsApp 💬'}
              </button>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
}
