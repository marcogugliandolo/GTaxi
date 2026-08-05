import React from 'react';

export interface VaixaLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical';
  outlineColor?: string;
  accentColor?: string;
}

export default function VaixaLogo({
  className = '',
  iconOnly = false,
  size = 48,
  showText = true,
  variant = 'dark',
  layout = 'horizontal',
  outlineColor,
  accentColor = '#FFC400',
}: VaixaLogoProps) {
  // Determine dark line color for outline, ears, eyes, etc.
  const darkColor = outlineColor || (variant === 'light' ? '#0F172A' : '#1E293B');
  // Determine text color for "vai"
  const vaiTextColor = variant === 'light' ? 'text-white' : 'text-slate-900 dark:text-white';

  const isVertical = layout === 'vertical';

  // Filter to ensure dark outline and ears pop on dark backgrounds when variant === 'light'
  const filterStyle = variant === 'light' ? { filter: 'drop-shadow(0px 0px 2.5px rgba(255, 255, 255, 0.85))' } : {};

  return (
    <div
      className={`inline-flex ${
        isVertical ? 'flex-col items-center text-center gap-0.5' : 'items-center gap-2'
      } ${className}`}
    >
      {/* Cow Taxi Logo SVG Icon */}
      <svg
        width={size}
        height={Math.round(size * 0.91)}
        viewBox="20 8 160 146"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105"
        style={filterStyle}
      >
        {/* Taxi Cap Light */}
        <path d="M76 34 C76 22 84 18 100 18 C116 18 124 22 124 34 Z" fill={accentColor} />
        {/* Checkerboard on Taxi Light */}
        <rect x="87" y="22" width="6" height="4" fill={darkColor} rx="0.5" />
        <rect x="107" y="22" width="6" height="4" fill={darkColor} rx="0.5" />
        <rect x="93" y="26" width="6" height="4" fill={darkColor} rx="0.5" />
        <rect x="101" y="26" width="6" height="4" fill={darkColor} rx="0.5" />
        <rect x="87" y="30" width="6" height="4" fill={darkColor} rx="0.5" />
        <rect x="107" y="30" width="6" height="4" fill={darkColor} rx="0.5" />

        {/* Left Horn */}
        <path d="M72 40 C64 26 69 16 76 12 C82 20 80 34 76 42 Z" fill={accentColor} />
        {/* Right Horn */}
        <path d="M128 40 C136 26 131 16 124 12 C118 20 120 34 124 42 Z" fill={accentColor} />

        {/* Left Ear */}
        <path d="M68 50 C44 44 32 58 46 70 C60 68 66 58 68 50 Z" fill={darkColor} />
        {/* Right Ear */}
        <path d="M132 50 C156 44 168 58 154 70 C140 68 134 58 132 50 Z" fill={darkColor} />

        {/* Face Outline */}
        <path
          d="M67 48 C78 44 122 44 133 48 C140 66 128 110 118 126 C110 138 90 138 82 126 C72 110 60 66 67 48 Z"
          fill="#FFFFFF"
          stroke={darkColor}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right decorative tail / ear stroke extension */}
        <path
          d="M130 58 C132 82 136 112 138 128 C139 140 131 148 122 146"
          fill="none"
          stroke={darkColor}
          strokeWidth="9"
          strokeLinecap="round"
        />

        {/* Eyes */}
        <ellipse cx="84" cy="78" rx="4.5" ry="7.5" fill={darkColor} />
        <ellipse cx="116" cy="78" rx="4.5" ry="7.5" fill={darkColor} />

        {/* Snout / Muzzle */}
        <rect x="68" y="102" width="64" height="38" rx="19" fill="#FFFFFF" stroke={accentColor} strokeWidth="8" />
        {/* Nostrils */}
        <ellipse cx="85" cy="121" rx="3.5" ry="6" fill={accentColor} />
        <ellipse cx="115" cy="121" rx="3.5" ry="6" fill={accentColor} />
      </svg>

      {!iconOnly && showText && (
        <span
          className={`font-black tracking-tight flex items-center leading-none lowercase ${vaiTextColor}`}
          style={{
            fontSize: isVertical
              ? `${Math.max(22, Math.round(size * 0.55))}px`
              : `${Math.max(20, Math.round(size * 0.65))}px`,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          <span>vai</span>
          <span className="text-[#FFC400]">xa</span>
        </span>
      )}
    </div>
  );
}

