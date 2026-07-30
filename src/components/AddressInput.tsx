import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, LocateFixed } from 'lucide-react';
import { LocationData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (location: LocationData) => void;
  dotColorClass: string;
  allowCurrentLocation?: boolean;
}

export default function AddressInput({ label, placeholder, value, onChange, onLocationSelect, dotColorClass, allowCurrentLocation = false }: AddressInputProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`, {
          headers: {
            'Accept-Language': 'es'
          }
        });
        const data = await response.json();
        
        const formatted: LocationData[] = data.map((item: any) => {
          const parts = item.display_name.split(', ');
          const address = parts.length > 3 ? `${parts[0]}, ${parts[1]}, ${parts[parts.length - 1]}` : item.display_name;
          return {
            address,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
          };
        });
        
        // Filter duplicates by address
        const unique = formatted.filter((v, i, a) => a.findIndex(t => (t.address === v.address)) === i);
        
        setSuggestions(unique);
        if (unique.length > 0) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (suggestion: LocationData) => {
    skipNextFetch.current = true;
    onChange(suggestion.address);
    setQuery(suggestion.address);
    if (onLocationSelect) {
      onLocationSelect(suggestion);
    }
    setIsOpen(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('noGeoSupport'));
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'Accept-Language': 'es'
            }
          });
          const data = await response.json();
          
          if (data && data.display_name) {
            const parts = data.display_name.split(', ');
            const formattedName = parts.length > 3 ? `${parts[0]}, ${parts[1]}, ${parts[parts.length - 1]}` : data.display_name;
            
            const locData = { address: formattedName, lat: latitude, lon: longitude };
            skipNextFetch.current = true;
            onChange(formattedName);
            setQuery(formattedName);
            if (onLocationSelect) {
              onLocationSelect(locData);
            }
            setIsOpen(false);
          }
        } catch (error) {
          console.error('Error fetching location:', error);
          alert(t('noLocationFound'));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        alert(t('noLocationAccess'));
      }
    );
  };

  const showCurrentLocationOption = allowCurrentLocation && (!query || query.length === 0);
  const hasDropdownContent = showCurrentLocationOption || suggestions.length > 0;

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`} ref={wrapperRef}>
      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2 mb-2 md:mb-3 ml-1">
        <div className={`w-2 h-2 rounded-full ${dotColorClass}`}></div>
        {label}
      </label>
      <div className="relative group">
        <MapPin className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (query.length >= 3 || showCurrentLocationOption) setIsOpen(true);
          }}
          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl py-3.5 md:py-5 pl-10 md:pl-12 pr-10 md:pr-12 text-slate-900 dark:text-white text-base md:text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
        <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" /> : <Search className="w-5 h-5" />}
        </div>
      </div>
      
      {isOpen && hasDropdownContent && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
          {showCurrentLocationOption && (
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCurrentLocation(); }}
              onTouchStart={(e) => { e.preventDefault(); handleCurrentLocation(); }}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700 transition-colors flex items-center gap-3 text-blue-600"
            >
              {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
              <span className="text-sm font-semibold">{t('useCurrentLocation')}</span>
            </button>
          )}
          
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
              onTouchStart={(e) => { e.preventDefault(); handleSelect(suggestion); }}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors flex items-start gap-3"
            >
              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{suggestion.address}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
