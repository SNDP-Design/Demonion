import React from 'react';

interface DemoDayLogoProps {
  className?: string;
}

export const DemoDayLogo: React.FC<DemoDayLogoProps> = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
    <rect width="48" height="48" rx="12" fill="#050505" />
    {/* Corner Brackets */}
    <path d="M12 18v-6h6" stroke="url(#demoday-logo-fill)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 12h6v6" stroke="url(#demoday-logo-fill)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 30v6h6" stroke="url(#demoday-logo-fill)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 36h6v-6" stroke="url(#demoday-logo-fill)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Camera Lens */}
    <circle cx="24" cy="24" r="6" stroke="url(#demoday-logo-fill)" strokeWidth="3.5" />
    {/* Record Dot */}
    <circle cx="24" cy="24" r="2" fill="#EF4444" />
    <defs>
      <linearGradient id="demoday-logo-fill" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8FAFC" />
        <stop offset=".44" stopColor="#6EE7F9" />
        <stop offset="1" stopColor="#A78BFA" />
      </linearGradient>
    </defs>
  </svg>
);

