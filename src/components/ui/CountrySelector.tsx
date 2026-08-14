import React, { useState, useRef, useEffect } from 'react';
import type { Country } from '../../lib/db';

interface CountrySelectorProps {
  countries: Country[];
  selectedCountryCode: string;
  onChange: (countryCode: string) => void;
}

export default function CountrySelector({ countries, selectedCountryCode, onChange }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find(c => c.code === selectedCountryCode);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div class="relative w-full" ref={wrapperRef}>
      <label class="block text-sm font-bold font-display text-darkpink-deep mb-2">
        Your Location (Determines Pricing Region) <span class="text-roseaccent">*</span>
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        class="w-full text-left bg-cream border-2 border-candy rounded-xl px-4 py-3 font-medium text-darkpink focus:outline-none focus:border-roseaccent hover:border-babypink transition-colors flex items-center justify-between"
      >
        <span>
          {selectedCountry ? `${selectedCountry.name} (${selectedCountry.currency_code})` : 'Select a country...'}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" class={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div class="absolute z-50 w-full mt-2 bg-white border-2 border-babypink rounded-xl shadow-xl overflow-hidden animate-fade-in">
          <div class="p-2 border-b border-candy">
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              class="w-full bg-cream border border-candy rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-roseaccent transition-colors text-darkpink"
            />
          </div>
          <div class="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  class={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                    selectedCountryCode === country.code
                      ? 'bg-rose-50 text-rose-700 font-bold'
                      : 'text-darkpink hover:bg-cream'
                  }`}
                >
                  <span>{country.name}</span>
                  <span class="text-xs text-darkpink-muted font-mono">{country.currency_code}</span>
                </button>
              ))
            ) : (
              <div class="px-4 py-3 text-sm text-darkpink-muted text-center italic">
                No countries found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
