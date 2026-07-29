import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, LocateFixed } from 'lucide-react';

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  dotColorClass: string;
  allowCurrentLocation?: boolean;
}

interface Suggestion {
  place_id: number;
  display_name: string;
}

export default function AddressInput({ label, placeholder, value, onChange, dotColorClass, allowCurrentLocation = false }: AddressInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
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

  const [userLoc, setUserLoc] = useState<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {} // ignore errors
      );
    }
  }, []);

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
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        if (userLoc) {
          url += `&lat=${userLoc.lat}&lon=${userLoc.lon}`;
        }
        
        const response = await fetch(url, {
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
    }, 300);

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

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
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
            
            onChange(formattedName);
            setQuery(formattedName);
            setIsOpen(false);
          }
        } catch (error) {
          console.error('Error fetching location:', error);
          alert('No se pudo obtener la dirección de tu ubicación.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        alert('No se pudo acceder a tu ubicación. Por favor, revisa los permisos.');
      }
    );
  };

  const showCurrentLocationOption = allowCurrentLocation && (!query || query.length < 3);
  const hasDropdownContent = showCurrentLocationOption || suggestions.length > 0;

  return (
    <div className="space-y-2 md:space-y-3 relative w-full" ref={wrapperRef}>
      <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">{label}</label>
      <div className="relative">
        <div className={`absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${dotColorClass} z-10`}></div>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl py-3.5 md:py-5 pl-10 md:pl-12 pr-10 md:pr-12 text-slate-900 text-base md:text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
        <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" /> : <Search className="w-5 h-5" />}
        </div>
      </div>
      
      {isOpen && hasDropdownContent && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden max-h-64 overflow-y-auto">
          {showCurrentLocationOption && (
            <button
              onClick={(e) => { e.preventDefault(); handleCurrentLocation(); }}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-center gap-3 text-blue-600"
            >
              {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
              <span className="text-sm font-semibold">Usar mi ubicación actual</span>
            </button>
          )}
          
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
