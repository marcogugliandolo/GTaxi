import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, LocateFixed } from 'lucide-react';

const CITIES = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", 
  "Málaga", "Murcia", "Palma de Mallorca", "Las Palmas de Gran Canaria",
  "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón",
  "L'Hospitalet de Llobregat", "Vitoria-Gasteiz", "A Coruña", "Granada",
  "Elche", "Oviedo", "Badalona", "Terrassa", "Cartagena", "Jerez de la Frontera",
  "Sabadell", "Móstoles", "Santa Cruz de Tenerife", "Alcalá de Henares",
  "Pamplona", "Almería", "Fuenlabrada", "Leganés", "Donostia-San Sebastián",
  "Getafe", "Burgos", "Santander", "Albacete", "Castellón de la Plana",
  "Alcorcón", "San Cristóbal de La Laguna", "Logroño", "Badajoz", "Huelva",
  "Salamanca", "Marbella", "Lleida", "Tarragona", "León", "Cádiz",
  "Ibiza", "Toledo", "Segovia", "Ávila", "Cuenca",
  "Aeropuerto de Madrid-Barajas (MAD)",
  "Aeropuerto de Barcelona-El Prat (BCN)",
  "Aeropuerto de Palma de Mallorca (PMI)",
  "Aeropuerto de Málaga-Costa del Sol (AGP)",
  "Aeropuerto de Alicante-Elche (ALC)",
  "Aeropuerto de Valencia (VLC)",
  "Aeropuerto de Tenerife Sur (TFS)",
  "Aeropuerto de Ibiza (IBZ)",
  "Aeropuerto de Sevilla (SVQ)",
  "Estación de Madrid Atocha",
  "Estación de Madrid Chamartín",
  "Estación de Barcelona Sants",
  "Estación de Sevilla Santa Justa",
  "Estación de Valencia Joaquín Sorolla"
];

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  dotColorClass: string;
  allowCurrentLocation?: boolean;
}

export default function AddressInput({ label, placeholder, value, onChange, dotColorClass, allowCurrentLocation = false }: AddressInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
    if (!query) {
      setSuggestions([]);
      return;
    }
    
    if (query === value) {
      return;
    }

    const filtered = CITIES.filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);
    
    setSuggestions(filtered);
    setIsOpen(true);
  }, [query, value]);

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setQuery(suggestion);
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
    
    // Simulate finding nearest city from the list
    setTimeout(() => {
      const defaultCity = "Madrid";
      onChange(defaultCity);
      setQuery(defaultCity);
      setIsOpen(false);
    }, 600);
  };

  const showCurrentLocationOption = allowCurrentLocation && (!query || query.length === 0);
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
          onFocus={() => {
            if (query) {
              const filtered = CITIES.filter(city => city.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
              setSuggestions(filtered);
            } else {
               // Show default popular cities when empty
               setSuggestions(CITIES.slice(0, 5));
            }
            setIsOpen(true);
          }}
          className="w-full bg-white border-2 border-slate-100 focus:ring-4 focus:ring-[#FFD700]/20 focus:border-[#FFD700] rounded-xl md:rounded-2xl py-3.5 md:py-5 pl-10 md:pl-12 pr-10 md:pr-12 text-slate-900 text-base md:text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm"
        />
        <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
      </div>
      
      {isOpen && hasDropdownContent && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden max-h-64 overflow-y-auto">
          {showCurrentLocationOption && (
            <button
              onClick={(e) => { e.preventDefault(); handleCurrentLocation(); }}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 border-b border-slate-100 transition-colors flex items-center gap-3 text-blue-600"
            >
              <LocateFixed className="w-5 h-5" />
              <span className="text-sm font-semibold">Usar mi ubicación actual</span>
            </button>
          )}
          
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-5 py-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors flex items-start gap-3"
            >
              <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-700 leading-snug">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
