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
  size = 48,
}: VaixaLogoProps) {
  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <img
        src="/logo.png"
        alt="Vaixa Logo"
        className="object-contain transition-transform hover:scale-105"
        style={{
          height: `${size * 1.4}px`,
          width: 'auto',
          maxWidth: '100%',
        }}
      />
    </div>
  );
}





