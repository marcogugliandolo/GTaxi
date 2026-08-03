import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, LocateFixed, Sparkles } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
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

interface SuggestionItem {
  id: string;
  primaryText: string;
  secondaryText: string;
  fullAddress: string;
  placeId?: string;
  lat?: number;
  lon?: number;
  isGoogle?: boolean;
}

export default function AddressInput({ label, placeholder, value, onChange, onLocationSelect, dotColorClass, allowCurrentLocation = false }: AddressInputProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextFetch = useRef(false);

  // Google Maps Libraries from @vis.gl/react-google-maps
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');

  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (placesLib && !autocompleteService) {
      try {
        setAutocompleteService(new placesLib.AutocompleteService());
      } catch (err) {
        console.warn('Failed to initialize Google Maps AutocompleteService:', err);
      }
    }
  }, [placesLib, autocompleteService]);

  useEffect(() => {
    if (geocodingLib && !geocoder) {
      try {
        setGeocoder(new geocodingLib.Geocoder());
      } catch (err) {
        console.warn('Failed to initialize Google Maps Geocoder:', err);
      }
    }
  }, [geocodingLib, geocoder]);

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

  const fetchNominatim = async (searchQuery: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await response.json();
      const formatted: SuggestionItem[] = data.map((item: any, idx: number) => {
        const parts = item.display_name.split(', ');
        const primaryText = parts[0] || item.display_name;
        const secondaryText = parts.slice(1, 3).join(', ');
        return {
          id: item.place_id ? String(item.place_id) : `nom-${idx}`,
          primaryText,
          secondaryText,
          fullAddress: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          isGoogle: false,
        };
      });
      
      const unique = formatted.filter((v, i, a) => a.findIndex(t => (t.fullAddress === v.fullAddress)) === i);
      setSuggestions(unique);
      if (unique.length > 0) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching fallback addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);

      if (autocompleteService) {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: ['es', 'pt'] },
          },
          (predictions, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions &&
              predictions.length > 0
            ) {
              const formatted: SuggestionItem[] = predictions.map((p) => ({
                id: p.place_id,
                primaryText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || '',
                fullAddress: p.description,
                placeId: p.place_id,
                isGoogle: true,
              }));
              setSuggestions(formatted);
              setIsOpen(true);
              setIsLoading(false);
            } else {
              fetchNominatim(query);
            }
          }
        );
      } else {
        fetchNominatim(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, autocompleteService]);

  const handleSelect = (suggestion: SuggestionItem) => {
    skipNextFetch.current = true;

    if (suggestion.placeId && geocoder) {
      setIsLoading(true);
      geocoder.geocode({ placeId: suggestion.placeId }, (results, status) => {
        setIsLoading(false);
        let lat = suggestion.lat;
        let lon = suggestion.lon;
        let address = suggestion.fullAddress;

        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          const loc = results[0].geometry.location;
          lat = loc.lat();
          lon = loc.lng();
          address = suggestion.fullAddress || results[0].formatted_address;
        }

        onChange(address);
        setQuery(address);
        if (onLocationSelect) {
          onLocationSelect({ address, lat, lon });
        }
        setIsOpen(false);
      });
    } else {
      onChange(suggestion.fullAddress);
      setQuery(suggestion.fullAddress);
      if (onLocationSelect) {
        onLocationSelect({
          address: suggestion.fullAddress,
          lat: suggestion.lat,
          lon: suggestion.lon,
        });
      }
      setIsOpen(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('noGeoSupport'));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (geocoder) {
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            setIsLocating(false);
            let address = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;

            if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
              address = results[0].formatted_address;
            }

            skipNextFetch.current = true;
            onChange(address);
            setQuery(address);
            if (onLocationSelect) {
              onLocationSelect({ address, lat: latitude, lon: longitude });
            }
            setIsOpen(false);
          });
        } else {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'Accept-Language': 'es' },
          })
            .then((res) => res.json())
            .then((data) => {
              const address = data?.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
              skipNextFetch.current = true;
              onChange(address);
              setQuery(address);
              if (onLocationSelect) {
                onLocationSelect({ address, lat: latitude, lon: longitude });
              }
            })
            .catch(() => {
              const address = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
              onChange(address);
              setQuery(address);
            })
            .finally(() => {
              setIsLocating(false);
              setIsOpen(false);
            });
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
  const isGoogleActive = Boolean(autocompleteService);

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`} ref={wrapperRef}>
      <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center justify-between mb-2 md:mb-3 ml-1">
        <span className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColorClass}`}></div>
          {label}
        </span>
        {isGoogleActive && (
          <span className="text-[10px] normal-case text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
            <Sparkles className="w-2.5 h-2.5" /> Google Maps
          </span>
        )}
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
            if (query.length >= 2 || showCurrentLocationOption) setIsOpen(true);
          }}
          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl py-3.5 md:py-5 pl-10 md:pl-12 pr-10 md:pr-12 text-slate-900 dark:text-white text-base md:text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
        <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#FFD700]" /> : <Search className="w-5 h-5" />}
        </div>
      </div>
      
      {isOpen && hasDropdownContent && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 overflow-hidden max-h-72 overflow-y-auto">
          {showCurrentLocationOption && (
            <button
              onMouseDown={(e) => { e.preventDefault(); handleCurrentLocation(); }}
              onTouchStart={(e) => { e.preventDefault(); handleCurrentLocation(); }}
              className="w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700 transition-colors flex items-center gap-3 text-blue-600 dark:text-blue-400 font-medium"
            >
              {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
              <span className="text-sm font-semibold">{t('useCurrentLocation')}</span>
            </button>
          )}
          
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(suggestion); }}
              onTouchStart={(e) => { e.preventDefault(); handleSelect(suggestion); }}
              className="w-full text-left px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors flex items-start gap-3"
            >
              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {suggestion.primaryText}
                </span>
                {suggestion.secondaryText && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {suggestion.secondaryText}
                  </span>
                )}
              </div>
            </button>
          ))}

          {/* Footer badge */}
          {isGoogleActive ? (
            <div className="px-5 py-2 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5 text-[11px] text-slate-400 font-medium">
              <span>Powered by</span>
              <span className="font-bold text-slate-600 dark:text-slate-300">Google Maps</span>
            </div>
          ) : (
            <div className="px-4 py-2.5 bg-amber-50/80 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 font-medium flex items-center justify-between">
              <span>💡 ¿Quieres usar la API oficial de Google Maps?</span>
              <span className="font-semibold text-amber-900 dark:text-amber-200 underline cursor-pointer">Añade GOOGLE_MAPS_PLATFORM_KEY</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

