import React, { useState, useEffect } from 'react';

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
}

interface FormProps {
  commissionTypes: CommissionType[];
  countries: Country[];
  selectedTypeId?: string;
}

export default function CommissionForm({ commissionTypes, countries, selectedTypeId = '' }: FormProps) {
  // Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCountry, setClientCountry] = useState('US');
  const [clientPhone, setClientPhone] = useState('');
  const [contactMethod, setContactMethod] = useState('email');
  const [commissionType, setCommissionType] = useState(selectedTypeId || (commissionTypes[0]?.id || ''));
  const [charCount, setCharCount] = useState(1);
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isCommercial, setIsCommercial] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Storage Reference URLs
  const [uploadedRefs, setUploadedRefs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Live Pricing State
  const [basePrice, setBasePrice] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [isOverride, setIsOverride] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  
  // Validation States
  const [phoneError, setPhoneError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync phone prefix when country changes
  useEffect(() => {
    const selected = countries.find(c => c.code === clientCountry);
    if (selected && selected.phone_prefix) {
      // If phone is empty or only has a prefix, update it
      if (!clientPhone || clientPhone.startsWith('+')) {
        setClientPhone(selected.phone_prefix + ' ');
      }
    }
  }, [clientCountry]);

  // Fetch price when type, country or overrides change
  useEffect(() => {
    if (!commissionType || !clientCountry) return;

    let active = true;
    const fetchPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const res = await fetch(`/api/calculate-price?typeId=${commissionType}&country=${clientCountry}`);
        if (!res.ok) throw new Error('Failed price fetch');
        const data = await res.json();
        if (active) {
          setBasePrice(data.finalPrice);
          setCurrency(data.currencyCode);
          setIsOverride(data.isOverride);
        }
      } catch (err) {
        console.error('Error fetching price:', err);
      } finally {
        if (active) setIsLoadingPrice(false);
      }
    };

    fetchPrice();
    return () => { active = false; };
  }, [commissionType, clientCountry]);

  // Handle live phone validation via standard fetch check or simple regex check
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientPhone(val);
    setPhoneError('');
  };

  // Handle File Uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    const newUploaded: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload-reference', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        newUploaded.push(data.url);
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || 'Failed to upload one or more files. (Max 5MB images allowed)');
      }
    }

    setUploadedRefs(prev => [...prev, ...newUploaded]);
    setIsUploading(false);
  };

  const removeReference = (idx: number) => {
    setUploadedRefs(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculations for display
  // Base Price + 50% for each additional character
  const charMultiplier = 1 + (charCount - 1) * 0.5;
  // +50% for commercial use
  const commercialMultiplier = isCommercial ? 1.5 : 1.0;
  
  const totalPrice = Math.round(basePrice * charMultiplier * commercialMultiplier * 100) / 100;

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/submit-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          client_email: clientEmail,
          client_country_code: clientCountry,
          client_phone: clientPhone,
          preferred_contact_method: contactMethod,
          commission_type_id: commissionType,
          character_count: charCount,
          description,
          reference_images: uploadedRefs,
          desired_deadline: deadline || undefined,
          is_commercial: isCommercial,
          additional_notes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitSuccess(true);
      // Scroll to success block
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Something went wrong during submission. Please check your inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div class="cute-card p-8 bg-white max-w-2xl mx-auto text-center flex flex-col items-center gap-6 animate-fade-in my-12">
        <div class="text-6xl animate-bounce">💖</div>
        <h2 class="text-3xl font-display text-darkpink-deep">Request Submitted!</h2>
        <p class="text-darkpink-muted font-medium text-lg leading-relaxed">
          Thank you so much, {clientName}! Your commission request has been received. 
          I will review the details and get back to you via your preferred contact method (<strong>{contactMethod}</strong>) with a confirmation invoice within 2-3 business days.
        </p>
        <div class="p-4 bg-blush border-2 border-babypink rounded-2xl w-full flex flex-col gap-2 font-semibold">
          <div class="flex justify-between text-sm">
            <span>Selected Style:</span>
            <span class="text-darkpink-deep font-bold">
              {commissionTypes.find(c => c.id === commissionType)?.title}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Estimated Quote:</span>
            <span class="text-roseaccent font-bold text-base">
              {currency === 'IDR' ? `Rp${totalPrice.toLocaleString()}` : `$${totalPrice} ${currency}`}
            </span>
          </div>
        </div>
        <a href="/" class="cute-btn text-lg mt-4">
          Return to Studio Home 🍓
        </a>
      </div>
    );
  }

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-12 max-w-6xl mx-auto px-4">
      
      {/* Left Column: Invoice & Pricing Preview */}
      <div class="lg:col-span-4 sticky top-6 flex flex-col gap-6">
        <div class="cute-card p-6 bg-white flex flex-col gap-4">
          <h3 class="text-xl font-display text-darkpink-deep border-b border-candy pb-2">Your Live Estimate</h3>
          
          <div class="flex flex-col gap-3 font-semibold text-sm">
            {/* Selected Type */}
            <div class="flex justify-between">
              <span class="text-darkpink-muted">Base Style:</span>
              <span class="text-darkpink-deep">{commissionTypes.find(c => c.id === commissionType)?.title || 'None Selected'}</span>
            </div>

            {/* Country */}
            <div class="flex justify-between">
              <span class="text-darkpink-muted">Pricing Region:</span>
              <span class="text-darkpink-deep">{countries.find(c => c.code === clientCountry)?.name || 'Default'}</span>
            </div>

            {/* Base Price */}
            <div class="flex justify-between">
              <span class="text-darkpink-muted">Base Price:</span>
              <span class="text-darkpink-deep">
                {isLoadingPrice ? 'Calculating...' : (currency === 'IDR' ? `Rp${basePrice.toLocaleString()}` : `$${basePrice} ${currency}`)}
              </span>
            </div>

            {/* Characters multiplier */}
            <div class="flex justify-between">
              <span class="text-darkpink-muted">Character Multiplier:</span>
              <span class="text-darkpink-deep">{charCount}x (x{charMultiplier.toFixed(1)})</span>
            </div>

            {/* Commercial Multiplier */}
            <div class="flex justify-between">
              <span class="text-darkpink-muted">Commercial Markup:</span>
              <span class="text-darkpink-deep">{isCommercial ? 'Yes (+50%)' : 'No (+0%)'}</span>
            </div>

            {isOverride && (
              <div class="text-xs text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-100 mt-1">
                ⭐ Regional custom pricing applied.
              </div>
            )}
          </div>

          {/* Total Price */}
          <div class="border-t border-candy pt-4 flex flex-col gap-1 items-end">
            <span class="text-xs font-bold text-darkpink-muted uppercase tracking-wider">Estimated Total</span>
            <span class="text-3xl font-display text-roseaccent font-bold">
              {isLoadingPrice ? '...' : (currency === 'IDR' ? `Rp${totalPrice.toLocaleString()}` : `$${totalPrice} ${currency}`)}
            </span>
            <span class="text-[10px] text-darkpink-muted italic mt-1 text-right">
              Quote locked at submission time. Turnaround time starts after deposit.
            </span>
          </div>
        </div>

        {/* Short Terms Summary */}
        <div class="bg-blush border-2 border-babypink rounded-3xl p-5 text-xs flex flex-col gap-2 font-medium">
          <h4 class="font-display font-bold text-darkpink-deep text-sm">💡 Quick Guide</h4>
          <p>• Prices include standard personal usage rights. Commercial work requires checking the Commercial check-box.</p>
          <p>• Final files are shared in high-resolution PNG format.</p>
          <p>• Two sketch revisions are allowed. Extra changes incur small fees.</p>
        </div>
      </div>

      {/* Right Column: Submission Form */}
      <form onSubmit={handleSubmit} class="lg:col-span-8 cute-card p-6 sm:p-8 bg-white flex flex-col gap-6">
        <h3 class="text-2xl font-display text-darkpink-deep border-b border-candy pb-3">Commission Request Form</h3>
        
        {submitError && (
          <div class="p-4 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-2xl font-semibold text-sm">
            🚨 {submitError}
          </div>
        )}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Your Name <span class="text-roseaccent">*</span></label>
            <input
              type="text"
              required
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Lulu"
              class="cute-input"
            />
          </div>

          {/* Email */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Email Address <span class="text-roseaccent">*</span></label>
            <input
              type="email"
              required
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              placeholder="e.g. lulu@example.com"
              class="cute-input"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Country Selector */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Your Location <span class="text-roseaccent">*</span></label>
            <select
              value={clientCountry}
              onChange={e => setClientCountry(e.target.value)}
              class="cute-input cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <span class="text-xs text-darkpink-muted font-medium">Used to determine currency & localized rates.</span>
          </div>

          {/* Phone */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Phone Number <span class="text-roseaccent">*</span></label>
            <input
              type="tel"
              required
              value={clientPhone}
              onChange={handlePhoneChange}
              placeholder="e.g. +62 812 3456 789"
              class={`cute-input ${phoneError ? 'border-red-400' : ''}`}
            />
            {phoneError && <span class="text-xs font-semibold text-red-500">{phoneError}</span>}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Preferred Contact Method */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Preferred Contact <span class="text-roseaccent">*</span></label>
            <select
              value={contactMethod}
              onChange={e => setContactMethod(e.target.value)}
              class="cute-input cursor-pointer"
            >
              <option value="email">Email</option>
              <option value="discord">Discord</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>

          {/* Commission Type */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Commission Style <span class="text-roseaccent">*</span></label>
            <select
              value={commissionType}
              onChange={e => setCommissionType(e.target.value)}
              class="cute-input cursor-pointer"
            >
              {commissionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Character Count */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Number of Characters <span class="text-roseaccent">*</span></label>
            <input
              type="number"
              required
              min="1"
              max="5"
              value={charCount}
              onChange={e => setCharCount(Math.max(1, Math.min(5, Number(e.target.value))))}
              class="cute-input"
            />
            <span class="text-xs text-darkpink-muted font-medium">Extra characters: +50% markup each (Max 5).</span>
          </div>

          {/* Deadline */}
          <div class="flex flex-col gap-2">
            <label class="font-display font-semibold text-darkpink-deep">Desired Deadline (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              class="cute-input cursor-pointer"
            />
          </div>
        </div>

        {/* Commercial usage toggle */}
        <div class="flex items-center gap-3 p-4 bg-blush border border-babypink rounded-2xl">
          <input
            type="checkbox"
            id="commercial-check"
            checked={isCommercial}
            onChange={e => setIsCommercial(e.target.checked)}
            class="w-5 h-5 accent-roseaccent rounded cursor-pointer"
          />
          <label htmlFor="commercial-check" class="font-display font-bold text-darkpink-deep cursor-pointer text-sm sm:text-base select-none">
            This is a commercial commission (Merchandise, Streaming assets, Branding)
          </label>
        </div>

        {/* Character Details Description */}
        <div class="flex flex-col gap-2">
          <label class="font-display font-semibold text-darkpink-deep">Character Description & Pose details <span class="text-roseaccent">*</span></label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Tell me about your character! Age, clothes, expressions, pose ideas, specific props, color theme, etc."
            class="cute-input resize-none"
          ></textarea>
        </div>

        {/* Reference Images Upload */}
        <div class="flex flex-col gap-2">
          <label class="font-display font-semibold text-darkpink-deep">Reference Images</label>
          
          <div class="flex items-center justify-center border-3 border-dashed border-babypink rounded-2xl p-6 bg-cream/40 relative">
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileUpload}
              class="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div class="text-center flex flex-col items-center gap-1">
              <span class="text-3xl">📤</span>
              <span class="font-bold text-sm text-darkpink-deep">Click or Drag images to upload</span>
              <span class="text-xs text-darkpink-muted">Max 5MB per file (JPEG, PNG, WEBP, GIF)</span>
            </div>
          </div>

          {isUploading && (
            <div class="flex items-center gap-2 text-xs font-semibold text-roseaccent animate-pulse mt-1">
              <span class="w-2.5 h-2.5 rounded-full bg-roseaccent animate-ping"></span>
              Uploading image references to studio storage...
            </div>
          )}

          {uploadError && <span class="text-xs font-semibold text-red-500 mt-1">{uploadError}</span>}

          {/* Reference Thumbnails */}
          {uploadedRefs.length > 0 && (
            <div class="flex flex-wrap gap-3 mt-3">
              {uploadedRefs.map((url, idx) => (
                <div key={idx} class="relative w-20 h-20 border-2 border-babypink rounded-xl overflow-hidden group">
                  <img src={url} alt="Reference Thumbnail" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeReference(idx)}
                    class="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div class="flex flex-col gap-2">
          <label class="font-display font-semibold text-darkpink-deep">Additional Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything else you'd like to add? Preferred contact times, special file requests, etc."
            class="cute-input resize-none"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div class="pt-4 border-t border-candy flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            class="cute-btn text-lg py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting Request...' : 'Submit Commission Request 💌'}
          </button>
        </div>
      </form>

    </div>
  );
}
