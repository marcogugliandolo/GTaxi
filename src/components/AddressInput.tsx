import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  dotColorClass: string;
}

interface Suggestion {
  place_id: number;
  display_name: string;
}

export default function AddressInput({ label, placeholder, value, onChange, dotColorClass }: AddressInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Sync external value changes
    if (value !== query && !isOpen) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (query === value) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
          headers: {
            'Accept-Language': 'es' // Prefer spanish results
          }
        });
        const data = await response.json();
        setSuggestions(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setIsLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (suggestion: Suggestion) => {
    const parts = suggestion.display_name.split(', ');
    const formattedName = parts.length > 3 ? `${parts[0]}, ${parts[1]}, ${parts[parts.length - 1]}` : suggestion.display_name;
    
    onChange(formattedName);
    setQuery(formattedName);
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="space-y-3 relative w-full" ref={wrapperRef}>
      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">{label}</label>
      <div className="relative">
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${dotColorClass} z-10`}></div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          className="w-full bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-2xl py-5 pl-12 pr-12 text-slate-900 text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" /> : <Search className="w-5 h-5" />}
        </div>
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-start gap-3"
            >
              <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 leading-snug">{suggestion.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
