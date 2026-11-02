import React from 'react';
import { DevelopmentLevel, TileType, TokenId } from '../game/types';

export const BlockBoulevardEmblem: React.FC<{ className?: string }> = ({ className = 'w-full max-w-md' }) => (
  <svg
    viewBox="0 0 540 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Block & Boulevard — Build your fortune, one block at a time"
  >
    {/* Architectural Skyline Crest */}
    <g transform="translate(18, 14)">
      {/* Outer Art-Deco Frame */}
      <rect x="0" y="18" width="96" height="96" rx="16" fill="#0F1B2E" stroke="#F59E0B" strokeWidth="2.5" />
      <rect x="6" y="24" width="84" height="84" rx="11" stroke="#14B8A6" strokeWidth="1.2" strokeDasharray="4 3" />
      {/* Back Left Tower */}
      <path d="M20 102V54L34 44V102H20Z" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
      {/* Back Right Tower */}
      <path d="M62 102V48L78 56V102H62Z" fill="#1E293B" stroke="#14B8A6" strokeWidth="1.5" />
      {/* Center Sovereign Spire */}
      <path d="M36 102V32L48 18L60 32V102H36Z" fill="#F59E0B" />
      <path d="M48 8V18" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
      {/* Windows on Center Spire */}
      <rect x="42" y="38" width="4" height="8" rx="1" fill="#0A111F" />
      <rect x="50" y="38" width="4" height="8" rx="1" fill="#0A111F" />
      <rect x="42" y="52" width="4" height="8" rx="1" fill="#0A111F" />
      <rect x="50" y="52" width="4" height="8" rx="1" fill="#0A111F" />
      <rect x="42" y="66" width="4" height="8" rx="1" fill="#0A111F" />
      <rect x="50" y="66" width="4" height="8" rx="1" fill="#0A111F" />
      {/* Boulevard Foreground Arch */}
      <path d="M12 102H84" stroke="#F4F1EA" strokeWidth="3" strokeLinecap="round" />
      <circle cx="48" cy="92" r="5" fill="#0A111F" stroke="#FDE68A" strokeWidth="1.5" />
    </g>

    {/* Typography Lockup */}
    <g transform="translate(132, 22)">
      <text
        x="0"
        y="20"
        fill="#14B8A6"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.24em"
      >
        METROPOLITAN PROPERTY STRATEGY
      </text>
      <text
        x="0"
        y="62"
        fill="#F4F1EA"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="42"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        BLOCK &amp;
      </text>
      <text
        x="198"
        y="62"
        fill="#F59E0B"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="42"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        BLVD
      </text>
      <line x1="0" y1="78" x2="380" y2="78" stroke="#334155" strokeWidth="1.5" />
      <text
        x="0"
        y="102"
        fill="#CBD5E1"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontSize="14.5"
        fontWeight="500"
      >
        Build your fortune, one block at a time.
      </text>
    </g>
  </svg>
);

export const TierBadgeSVG: React.FC<{
  tier: 'S+' | 'S' | 'A+';
  className?: string;
}> = ({ tier, className = '' }) => {
  if (tier === 'S+') {
    return (
      <span
        className={`inline-flex items-center justify-center font-black text-[11px] leading-none px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-amber-950 font-mono shadow-md border border-yellow-200 ${className}`}
      >
        S+
      </span>
    );
  }
  if (tier === 'S') {
    return (
      <span
        className={`inline-flex items-center justify-center font-black text-[11px] leading-none px-1.5 py-0.5 rounded bg-gradient-to-r from-rose-500 via-red-400 to-rose-600 text-white font-mono shadow-md border border-rose-300 ${className}`}
      >
        S
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center font-black text-[11px] leading-none px-1.5 py-0.5 rounded bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-600 text-white font-mono shadow-md border border-purple-300 ${className}`}
    >
      A+
    </span>
  );
};

export const PlayerTokenSVG: React.FC<{
  token?: TokenId | string;
  cardId?: string;
  color: string;
  size?: number;
  className?: string;
}> = ({ token = 'aviator', cardId, color, size = 32, className = '' }) => {
  const effectiveId = cardId || token || 'aviator';

  switch (effectiveId) {
    case 'garuda-aviator':
    case 'aviator':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-label="Garuda Aviator">
          <circle cx="18" cy="18" r="16" fill="#0A1628" stroke={color} strokeWidth="2.5" />
          {/* Golden Winged Crown */}
          <path d="M10 14C10 14 14 11 18 11C22 11 26 14 26 14" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
          {/* Aviator Goggles */}
          <rect x="11" y="15" width="6" height="5" rx="1.5" fill="#38BDF8" stroke="#F8FAFC" strokeWidth="1" />
          <rect x="19" y="15" width="6" height="5" rx="1.5" fill="#38BDF8" stroke="#F8FAFC" strokeWidth="1" />
          <line x1="17" y1="17.5" x2="19" y2="17.5" stroke="#F8FAFC" strokeWidth="1.2" />
          {/* Scarf / Pilot Crest */}
          <path d="M14 22L18 26L22 22L18 20L14 22Z" fill="#F59E0B" />
          <path d="M7 19L11 16M29 19L25 16" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'gatot-kaca':
    case 'warrior':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-label="Gatotkaca">
          <circle cx="18" cy="18" r="16" fill="#1C1304" stroke={color} strokeWidth="2.5" />
          {/* Crown (Mahkota Wayang) */}
          <path d="M14 9L18 5L22 9L20 13H16L14 9Z" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1" />
          {/* Face and Bintang Antakusuma Armor */}
          <circle cx="18" cy="18" r="5" fill="#FDE68A" />
          <path d="M11 25L18 20L25 25L18 29L11 25Z" fill="#D97706" stroke="#FDE68A" strokeWidth="1" />
          {/* Wings */}
          <path d="M8 17C6 14 7 11 9 12L12 16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <path d="M28 17C30 14 29 11 27 12L24 16" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'dewi-sri':
    case 'maiden':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-label="Dewi Sri">
          <circle cx="18" cy="18" r="16" fill="#042017" stroke={color} strokeWidth="2.5" />
          {/* Golden Rice Stalk Tiara */}
          <circle cx="18" cy="17" r="5" fill="#FEF08A" />
          <path d="M12 12C14 8 18 8 18 8C18 8 22 8 24 12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <circle cx="14" cy="10" r="1.5" fill="#F59E0B" />
          <circle cx="18" cy="7" r="1.8" fill="#F59E0B" />
          <circle cx="22" cy="10" r="1.5" fill="#F59E0B" />
          {/* Kebaya Lotus Crest */}
          <path d="M15 24C15 21 18 20 18 20C18 20 21 21 21 24L18 28L15 24Z" fill="#10B981" stroke="#6EE7B7" strokeWidth="1" />
        </svg>
      );

    case 'sultan-hasanuddin':
    case 'mariner':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-label="Sultan Celebes">
          <circle cx="18" cy="18" r="16" fill="#240A0A" stroke={color} strokeWidth="2.5" />
          {/* Songkok Recca Royal Headwear */}
          <rect x="12" y="9" width="12" height="6" rx="2" fill="#DC2626" stroke="#FDE68A" strokeWidth="1" />
          {/* Phinisi Boat Sail Emblem */}
          <path d="M18 16V28M18 17L24 23H18M18 19L13 24H18" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 27L14 30H22L26 27" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'batik-prodigy':
    case 'artisan':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-label="Batik Master">
          <circle cx="18" cy="18" r="16" fill="#1A0A26" stroke={color} strokeWidth="2.5" />
          {/* Blangkon Headwear */}
          <path d="M12 15C12 11 15 9 18 9C21 9 24 11 24 15H12Z" fill="#A855F7" stroke="#E9D5FF" strokeWidth="1" />
          <circle cx="24" cy="14" r="2" fill="#A855F7" />
          {/* Canting Quill & Parang wave */}
          <path d="M13 24Q18 21 23 24" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14 27Q18 24 22 27" stroke="#D8B4FE" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="18" cy="19" r="1.5" fill="#FDE68A" />
        </svg>
      );

    case 'METRO_TRAIN':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="#0F172A" stroke={color} strokeWidth="2.5" />
          <rect x="9" y="7" width="14" height="15" rx="3.5" fill={color} />
          <rect x="11" y="10" width="10" height="5" rx="1" fill="#0F172A" />
          <circle cx="12.5" cy="19" r="1.4" fill="#0F172A" />
          <circle cx="19.5" cy="19" r="1.4" fill="#0F172A" />
          <path d="M10 25L12 22H20L22 25" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'SPIRE_TOWER':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="#0F172A" stroke={color} strokeWidth="2.5" />
          <path d="M16 5L20 12V24H12V12L16 5Z" fill={color} />
          <rect x="14.5" y="14" width="3" height="8" rx="0.8" fill="#0F172A" />
          <path d="M10 24H22" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-label="Default Token">
          <circle cx="18" cy="18" r="16" fill="#0A1628" stroke={color} strokeWidth="2.5" />
          <circle cx="18" cy="18" r="8" fill={color} />
          <path d="M14 18L17 21L22 15" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

export const TileCategorySVG: React.FC<{
  type: TileType;
  className?: string;
}> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'START':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 3L4 9V21H20V9L12 3Z" stroke="#F59E0B" strokeWidth="2" fill="#F59E0B" fillOpacity="0.2" />
          <path d="M9 21V13H15V21" stroke="#FDE68A" strokeWidth="1.8" />
        </svg>
      );
    case 'HOLDING':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="#94A3B8" strokeWidth="2" />
          <path d="M9 4V20M15 4V20M4 12H20" stroke="#94A3B8" strokeWidth="1.8" />
        </svg>
      );
    case 'PLAZA':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="#14B8A6" strokeWidth="2" fill="#14B8A6" fillOpacity="0.18" />
          <circle cx="12" cy="12" r="3" fill="#5EEAD4" />
        </svg>
      );
    case 'GO_TO_HOLDING':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M12 2L4 6V12C4 17 7.5 20.8 12 22C16.5 20.8 20 17 20 12V6L12 2Z" stroke="#F43F5E" strokeWidth="2" fill="#F43F5E" fillOpacity="0.2" />
          <path d="M12 8V13M12 16H12.01" stroke="#FECDD3" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'TRANSPORT':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="5" y="4" width="14" height="13" rx="3" stroke="#38BDF8" strokeWidth="2" fill="#0284C7" fillOpacity="0.2" />
          <path d="M8 9H16M8 14H10M14 14H16M7 20L9 17M17 20L15 17" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'SERVICE':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M13 2L4 14H11L10 22L20 10H13L13 2Z" stroke="#FACC15" strokeWidth="2" fill="#EAB308" fillOpacity="0.25" strokeLinejoin="round" />
        </svg>
      );
    case 'EVENT':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="#A855F7" strokeWidth="2" fill="#9333EA" fillOpacity="0.2" />
          <path d="M9 8H15M9 12H15M9 16H12" stroke="#E9D5FF" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'FEE':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#FB7185" strokeWidth="2" fill="#E11D48" fillOpacity="0.18" />
          <path d="M12 7V17M9.5 9.5C9.5 8.5 10.6 8 12 8C13.4 8 14.5 8.6 14.5 9.8C14.5 11 13.5 11.4 12 11.8C10.5 12.2 9.5 12.8 9.5 14C9.5 15.2 10.6 16 12 16C13.4 16 14.5 15.3 14.5 14.2" stroke="#FFE4E6" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'PROPERTY':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M4 20V9L12 4L20 9V20H4Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
};

export const DevelopmentBadgeSVG: React.FC<{
  level: DevelopmentLevel;
  className?: string;
}> = ({ level, className = 'w-4 h-4' }) => {
  if (level === 0) return null;
  if (level === 1) {
    // Completed district star ring
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-label="Completed District">
        <circle cx="10" cy="10" r="8" fill="#0F172A" stroke="#FDE68A" strokeWidth="1.8" />
        <path d="M10 5L11.5 8.2L15 8.7L12.5 11.1L13.1 14.6L10 12.9L6.9 14.6L7.5 11.1L5 8.7L8.5 8.2L10 5Z" fill="#F59E0B" />
      </svg>
    );
  }
  if (level === 2) {
    // Business structure
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-label="Business Built">
        <rect x="2" y="2" width="16" height="16" rx="3" fill="#0D9488" stroke="#99F6E4" strokeWidth="1.5" />
        <path d="M5 15V8L10 5L15 8V15H5Z" fill="#F0FDFA" />
        <rect x="8.5" y="10.5" width="3" height="4.5" fill="#0F172A" />
      </svg>
    );
  }
  // Landmark tower
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-label="Landmark Built">
      <rect x="2" y="2" width="16" height="16" rx="3" fill="#D97706" stroke="#FEF08A" strokeWidth="1.6" />
      <path d="M10 3L13.5 7.5V16H6.5V7.5L10 3Z" fill="#FFFBEB" />
      <rect x="8.8" y="9" width="2.4" height="5" fill="#78350F" />
    </svg>
  );
};

export const DiceFaceSVG: React.FC<{
  value: number;
  rolling?: boolean;
  size?: number;
}> = ({ value, rolling = false, size = 44 }) => {
  const pips: Record<number, [number, number][]> = {
    1: [[24, 24]],
    2: [
      [14, 14],
      [34, 34],
    ],
    3: [
      [14, 14],
      [24, 24],
      [34, 34],
    ],
    4: [
      [14, 14],
      [34, 14],
      [14, 34],
      [34, 34],
    ],
    5: [
      [14, 14],
      [34, 14],
      [24, 24],
      [14, 34],
      [34, 34],
    ],
    6: [
      [14, 12],
      [34, 12],
      [14, 24],
      [34, 24],
      [14, 36],
      [34, 36],
    ],
  };

  const activePips = pips[value] || pips[1];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`transition-transform duration-150 ${rolling ? 'animate-spin scale-105' : 'scale-100'}`}
      aria-label={`Die showing ${value}`}
    >
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="9"
        fill="#F4F1EA"
        stroke="#F59E0B"
        strokeWidth="2.5"
      />
      <rect x="6" y="6" width="36" height="36" rx="6" stroke="#E2DEC9" strokeWidth="1" />
      {activePips.map(([cx, cy], idx) => (
        <circle key={idx} cx={cx} cy={cy} r="3.8" fill="#0F172A" />
      ))}
    </svg>
  );
};
