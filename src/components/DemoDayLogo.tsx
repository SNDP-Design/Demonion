import React from 'react';

interface DemoDayLogoProps {
  className?: string;
}

export const DemoDayLogo: React.FC<DemoDayLogoProps> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect width="48" height="48" rx="12" fill="#050505" />
    <path d="M15 11h10.6C34 11 40 16.5 40 24s-6 13-14.4 13H15V11Z" fill="url(#demoday-logo-fill)" />
    <path d="M22.5 18.2v11.6h3.1c3.7 0 6.3-2.3 6.3-5.8s-2.6-5.8-6.3-5.8h-3.1Z" fill="#050505" />
    <path d="M11 36.8 36.8 11" stroke="#F7F7F7" strokeWidth="3.2" strokeLinecap="round" />
    <defs>
      <linearGradient id="demoday-logo-fill" x1="12.3" y1="11" x2="39" y2="37.8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8FAFC" />
        <stop offset=".44" stopColor="#6EE7F9" />
        <stop offset="1" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
  </svg>
);
