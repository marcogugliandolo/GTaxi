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
  variant = 'dark',
}: VaixaLogoProps) {
  const imageSrc = variant === 'light' ? '/logo-blanco.png' : '/logo.png';

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={imageSrc}
        alt="Vaixa Logo"
        className="object-contain transition-transform hover:scale-105"
        style={{
          height: `${size}px`,
          width: 'auto',
          maxWidth: '100%',
        }}
      />
    </div>
  );
}





