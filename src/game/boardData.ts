import { BoardTile, CharacterCard, DistrictId, DistrictInfo } from './types';

export const STARTING_CREDITS = 1500; // Represents 1,500,000 Rp in display
export const CITY_HALL_BONUS = 200;   // Represents 200,000 Rp in display
export const HOLDING_BAIL_COST = 50;  // Represents 50,000 Rp in display
export const MAX_HOLDING_ATTEMPTS = 3;

/**
 * LINE Let's Get Rich inspired Character Cards (Class S+, S, A+)
 */
export const CHARACTER_CARD_CATALOG: CharacterCard[] = [
  {
    id: 'garuda-aviator',
    name: 'Garuda Aviator',
    title: 'Skyline Captain',
    tier: 'S+',
    color: '#0284C7',
    avatarId: 'aviator',
    diceControl: 85,
    tollDiscount: 20,
    islandEscapeBonus: 15,
    description: 'High-altitude Indonesian pilot with supreme dice gauge precision.',
  },
  {
    id: 'gatot-kaca',
    name: 'Gatotkaca',
    title: 'Knight of Pringgandani',
    tier: 'S+',
    color: '#F59E0B',
    avatarId: 'warrior',
    diceControl: 88,
    tollDiscount: 18,
    islandEscapeBonus: 20,
    description: 'Legendary winged hero endowed with golden armor and flight agility.',
  },
  {
    id: 'dewi-sri',
    name: 'Dewi Sri',
    title: 'Goddess of Prosperity',
    tier: 'S',
    color: '#10B981',
    avatarId: 'maiden',
    diceControl: 80,
    tollDiscount: 25,
    islandEscapeBonus: 10,
    description: 'Bringer of harvest, golden rice fields, and generous toll protection.',
  },
  {
    id: 'sultan-hasanuddin',
    name: 'Sultan Celebes',
    title: 'Rooster of the East',
    tier: 'S',
    color: '#EF4444',
    avatarId: 'mariner',
    diceControl: 78,
    tollDiscount: 15,
    islandEscapeBonus: 25,
    description: 'Maritime sovereign commanding trade routes across the archipelago.',
  },
  {
    id: 'batik-prodigy',
    name: 'Batik Master',
    title: 'Heritage Artisan',
    tier: 'A+',
    color: '#A855F7',
    avatarId: 'artisan',
    diceControl: 72,
    tollDiscount: 12,
    islandEscapeBonus: 10,
    description: 'Visionary designer weaving intricate royal patterns into city blocks.',
  },
];

export const TOKEN_CATALOG = CHARACTER_CARD_CATALOG.map((c) => ({
  id: c.id,
  name: c.name,
  label: c.title,
  color: c.color,
  avatarId: c.avatarId,
  tier: c.tier,
  description: c.description,
}));

export const DISTRICTS: Record<DistrictId, DistrictInfo> = {
  MEDAN: {
    id: 'MEDAN',
    name: 'Medan',
    island: 'North Sumatra',
    color: '#D97706', // Amber Terracotta
    accentLight: '#FDE68A',
    borderHex: '#B45309',
    description: 'Historic Dutch-Deli trading hub and gateway to Lake Toba.',
    tileIndices: [1, 2, 4],
  },
  BANDUNG: {
    id: 'BANDUNG',
    name: 'Bandung',
    island: 'West Java',
    color: '#0284C7', // Paris van Java Blue
    accentLight: '#BAE6FD',
    borderHex: '#0369A1',
    description: 'Cool highland fashion avenue and art-deco heritage boulevards.',
    tileIndices: [5, 6, 7],
  },
  SURABAYA: {
    id: 'SURABAYA',
    name: 'Surabaya',
    island: 'East Java',
    color: '#DC2626', // Heroic Crimson
    accentLight: '#FECDD3',
    borderHex: '#B91C1C',
    description: 'Industrial maritime gateway and proud City of Heroes.',
    tileIndices: [9, 10, 11],
  },
  MAKASSAR: {
    id: 'MAKASSAR',
    name: 'Makassar',
    island: 'South Sulawesi',
    color: '#7C3AED', // Celebes Royal Violet
    accentLight: '#DDD6FE',
    borderHex: '#6D28D9',
    description: 'Vibrant spice port, coastal promenades, and sunset bastion.',
    tileIndices: [13, 14, 15],
  },
  DENPASAR: {
    id: 'DENPASAR',
    name: 'Denpasar',
    island: 'Bali & Nusa',
    color: '#059669', // Island Emerald
    accentLight: '#A7F3D0',
    borderHex: '#047857',
    description: 'Island of the Gods: sacred temples, surf beaches, and arts colony.',
    tileIndices: [17, 18, 20],
  },
  JAKARTA: {
    id: 'JAKARTA',
    name: 'Jakarta',
    island: 'Special Capital Region',
    color: '#EAB308', // Monas Gold
    accentLight: '#FEF08A',
    borderHex: '#CA8A04',
    description: 'Bustling capital metropolis of shimmering financial spires.',
    tileIndices: [25, 27, 29],
  },
};

export const TRANSPORT_RENT_TABLE: [number, number, number, number] = [25, 50, 100, 200];
export const SERVICE_MULTIPLIERS = {
  SINGLE: 4,
  BOTH: 10,
};

/**
 * 32-Space Indonesian Board Configuration
 * Corners: 0 (Istana Merdeka), 8 (Pulau Terisolasi), 16 (Alun-Alun Monas), 24 (Kantor Kejaksaan)
 * Sides for Line Monopoly:
 * - bottom: 1, 2, 3, 4, 5, 6, 7 (Medan, Bandung, Soekarno-Hatta)
 * - left: 9, 10, 11, 12, 13, 14, 15 (Surabaya, Makassar, Juanda)
 * - top: 17, 18, 19, 20, 21, 22, 23 (Denpasar, Ngurah Rai, PLN, Berita Kota, Retribusi)
 * - right: 25, 26, 27, 28, 29, 30, 31 (Jakarta, Hasanuddin, PDAM, Pengumuman, Izin)
 */
export const BOARD_TILES: BoardTile[] = [
  // --- BOTTOM ROW (0 to 8) ---
  {
    id: 'istana-merdeka',
    index: 0,
    name: 'Istana Merdeka',
    shortName: 'Istana Start',
    type: 'START',
    description: 'Starting position. Collect Rp 200,000 whenever passing or landing on Istana Merdeka.',
  },
  {
    id: 'kesawan-street',
    index: 1,
    name: 'Kesawan Street',
    shortName: 'Kesawan St',
    type: 'PROPERTY',
    district: 'MEDAN',
    purchasePrice: 60,
    baseRent: 6,
    rentTiers: [6, 12, 35, 90],
    developmentCost: 50,
    lineSide: 'bottom',
    description: 'Historic colonial arcade and noodle stalls in downtown Medan.',
  },
  {
    id: 'maimun-palace-way',
    index: 2,
    name: 'Maimun Palace Way',
    shortName: 'Istana Maimun',
    type: 'PROPERTY',
    district: 'MEDAN',
    purchasePrice: 60,
    baseRent: 8,
    rentTiers: [8, 16, 45, 110],
    developmentCost: 50,
    lineSide: 'bottom',
    description: 'Grand royal palace grounds of the Sultanate of Deli.',
  },
  {
    id: 'bandara-soekarno-hatta',
    index: 3,
    name: 'Bandara Soekarno-Hatta (CGK)',
    shortName: 'CGK Airport',
    type: 'TRANSPORT',
    purchasePrice: 150,
    baseRent: 25,
    rentTiers: TRANSPORT_RENT_TABLE,
    lineSide: 'bottom',
    description: 'Indonesia’s premier international aviation gateway.',
  },
  {
    id: 'lake-toba-walk',
    index: 4,
    name: 'Lake Toba Walk',
    shortName: 'Danau Toba',
    type: 'PROPERTY',
    district: 'MEDAN',
    purchasePrice: 80,
    baseRent: 10,
    rentTiers: [10, 20, 60, 140],
    developmentCost: 50,
    lineSide: 'bottom',
    description: 'Breathtaking volcanic lake caldera and Samosir Island views.',
  },
  {
    id: 'braga-street',
    index: 5,
    name: 'Braga Street',
    shortName: 'Jalan Braga',
    type: 'PROPERTY',
    district: 'BANDUNG',
    purchasePrice: 100,
    baseRent: 12,
    rentTiers: [12, 24, 70, 170],
    developmentCost: 75,
    lineSide: 'bottom',
    description: 'Famed Paris van Java promenade of cozy cafes and boutique art houses.',
  },
  {
    id: 'gedung-sate-avenue',
    index: 6,
    name: 'Gedung Sate Avenue',
    shortName: 'Gedung Sate',
    type: 'PROPERTY',
    district: 'BANDUNG',
    purchasePrice: 100,
    baseRent: 12,
    rentTiers: [12, 24, 75, 180],
    developmentCost: 75,
    lineSide: 'bottom',
    description: 'Iconic government landmark crowned with its distinctive satay skewer finial.',
  },
  {
    id: 'tangkuban-perahu',
    index: 7,
    name: 'Tangkuban Perahu',
    shortName: 'Tangkuban',
    type: 'PROPERTY',
    district: 'BANDUNG',
    purchasePrice: 120,
    baseRent: 16,
    rentTiers: [16, 32, 90, 210],
    developmentCost: 75,
    lineSide: 'bottom',
    description: 'Majestic volcanic crater ridge attracting thousands of mountain tourists.',
  },

  // --- CORNER 1: Pulau Terisolasi ---
  {
    id: 'pulau-terisolasi',
    index: 8,
    name: 'Pulau Terisolasi',
    shortName: 'Pulau Asing',
    type: 'HOLDING',
    description: 'Stranded on a remote tropical island! Normal visits are relaxed beach trips.',
  },

  // --- LEFT COLUMN (9 to 15) ---
  {
    id: 'tunjungan-street',
    index: 9,
    name: 'Tunjungan Street',
    shortName: 'Jl Tunjungan',
    type: 'PROPERTY',
    district: 'SURABAYA',
    purchasePrice: 140,
    baseRent: 18,
    rentTiers: [18, 36, 105, 240],
    developmentCost: 100,
    lineSide: 'left',
    description: 'Historic neon-lit avenue of heritage hotels and modern entertainment.',
  },
  {
    id: 'ampel-quarter',
    index: 10,
    name: 'Ampel Quarter',
    shortName: 'Ampel Quarters',
    type: 'PROPERTY',
    district: 'SURABAYA',
    purchasePrice: 140,
    baseRent: 18,
    rentTiers: [18, 36, 110, 250],
    developmentCost: 100,
    lineSide: 'left',
    description: 'Ancient spice market and historic cultural crossroads of the East Java coast.',
  },
  {
    id: 'suramadu-way',
    index: 11,
    name: 'Suramadu Way',
    shortName: 'Jembatan Suramadu',
    type: 'PROPERTY',
    district: 'SURABAYA',
    purchasePrice: 160,
    baseRent: 22,
    rentTiers: [22, 44, 125, 280],
    developmentCost: 100,
    lineSide: 'left',
    description: 'Monumental suspension bridge spanning the Madura Strait.',
  },
  {
    id: 'bandara-juanda',
    index: 12,
    name: 'Bandara Juanda (SUB)',
    shortName: 'SUB Airport',
    type: 'TRANSPORT',
    purchasePrice: 150,
    baseRent: 25,
    rentTiers: TRANSPORT_RENT_TABLE,
    lineSide: 'left',
    description: 'Eastern Java commercial passenger and air freight hub.',
  },
  {
    id: 'losari-beachwalk',
    index: 13,
    name: 'Losari Beachwalk',
    shortName: 'Pantai Losari',
    type: 'PROPERTY',
    district: 'MAKASSAR',
    purchasePrice: 180,
    baseRent: 24,
    rentTiers: [24, 48, 140, 320],
    developmentCost: 125,
    lineSide: 'left',
    description: 'Sunset promenade famed for floating mosques and banana epe stalls.',
  },
  {
    id: 'fort-rotterdam',
    index: 14,
    name: 'Fort Rotterdam',
    shortName: 'Ft Rotterdam',
    type: 'PROPERTY',
    district: 'MAKASSAR',
    purchasePrice: 180,
    baseRent: 24,
    rentTiers: [24, 48, 145, 330],
    developmentCost: 125,
    lineSide: 'left',
    description: 'Ancient 17th-century Gowa sea fortress safeguarding Celebes trade.',
  },
  {
    id: 'somba-opu-avenue',
    index: 15,
    name: 'Somba Opu Avenue',
    shortName: 'Somba Opu',
    type: 'PROPERTY',
    district: 'MAKASSAR',
    purchasePrice: 200,
    baseRent: 28,
    rentTiers: [28, 56, 165, 370],
    developmentCost: 125,
    lineSide: 'left',
    description: 'Glamorous gold bullion merchants and silversmith workshops.',
  },

  // --- CORNER 2: Alun-Alun Monas ---
  {
    id: 'alun-alun-monas',
    index: 16,
    name: 'Alun-Alun Monas',
    shortName: 'Monas Plaza',
    type: 'PLAZA',
    description: 'National sanctuary garden. Relax under the shade—no tolls or levies here.',
  },

  // --- TOP ROW (17 to 23) ---
  {
    id: 'sanur-coastal-road',
    index: 17,
    name: 'Sanur Coastal Road',
    shortName: 'Pantai Sanur',
    type: 'PROPERTY',
    district: 'DENPASAR',
    purchasePrice: 220,
    baseRent: 30,
    rentTiers: [30, 60, 180, 410],
    developmentCost: 150,
    lineSide: 'top',
    description: 'Calm turquoise sunrise lagoon lined with traditional jukung outriggers.',
  },
  {
    id: 'kuta-boulevard',
    index: 18,
    name: 'Kuta Boulevard',
    shortName: 'Kuta Sunset',
    type: 'PROPERTY',
    district: 'DENPASAR',
    purchasePrice: 220,
    baseRent: 30,
    rentTiers: [30, 60, 190, 425],
    developmentCost: 150,
    lineSide: 'top',
    description: 'World-famous surf break and bustling tourist avenue.',
  },
  {
    id: 'pln-persero',
    index: 19,
    name: 'PLN Nusantara',
    shortName: 'PLN Listrik',
    type: 'SERVICE',
    purchasePrice: 140,
    lineSide: 'top',
    description: 'National electrical utility. Rent is 4× dice roll (10× if you own both utilities).',
  },
  {
    id: 'ubud-heritage-terrace',
    index: 20,
    name: 'Ubud Heritage Terrace',
    shortName: 'Ubud Terrace',
    type: 'PROPERTY',
    district: 'DENPASAR',
    purchasePrice: 240,
    baseRent: 34,
    rentTiers: [34, 68, 210, 460],
    developmentCost: 150,
    lineSide: 'top',
    description: 'Cascading emerald rice terraces and royal arts colony.',
  },
  {
    id: 'bandara-ngurah-rai',
    index: 21,
    name: 'Bandara Ngurah Rai (DPS)',
    shortName: 'DPS Airport',
    type: 'TRANSPORT',
    purchasePrice: 150,
    baseRent: 25,
    rentTiers: TRANSPORT_RENT_TABLE,
    lineSide: 'top',
    description: 'Bali’s iconic seaside runway welcoming world travelers.',
  },
  {
    id: 'berita-kota',
    index: 22,
    name: 'Berita Kota',
    shortName: 'Berita Kota',
    type: 'EVENT',
    deckType: 'CITY_PULSE',
    lineSide: 'top',
    description: 'Draw a Berita Kota event card for sudden archipelago fortune.',
  },
  {
    id: 'retribusi-daerah',
    index: 23,
    name: 'Retribusi Daerah',
    shortName: 'Retribusi',
    type: 'FEE',
    feeAmount: 100,
    lineSide: 'top',
    description: 'Regional infrastructure assessment. Pay Rp 100,000 to the regional fund.',
  },

  // --- CORNER 3: Kantor Kejaksaan ---
  {
    id: 'kantor-kejaksaan',
    index: 24,
    name: 'Kantor Kejaksaan',
    shortName: 'Kejaksaan',
    type: 'GO_TO_HOLDING',
    description: 'Inspection order! Move directly to Pulau Terisolasi without collecting Istana bonus.',
  },

  // --- RIGHT COLUMN (25 to 31) ---
  {
    id: 'sudirman-boulevard',
    index: 25,
    name: 'Sudirman Boulevard',
    shortName: 'Jl Sudirman',
    type: 'PROPERTY',
    district: 'JAKARTA',
    purchasePrice: 260,
    baseRent: 38,
    rentTiers: [38, 76, 230, 510],
    developmentCost: 175,
    lineSide: 'right',
    description: 'Main financial artery flanked by towering multinational headquarters.',
  },
  {
    id: 'pdam-nusantara',
    index: 26,
    name: 'PDAM Nusantara',
    shortName: 'PDAM Air',
    type: 'SERVICE',
    purchasePrice: 140,
    lineSide: 'right',
    description: 'National water supply network. Rent is 4× dice roll (10× if you own both utilities).',
  },
  {
    id: 'thamrin-square',
    index: 27,
    name: 'Thamrin Square',
    shortName: 'Bundaran HI',
    type: 'PROPERTY',
    district: 'JAKARTA',
    purchasePrice: 280,
    baseRent: 42,
    rentTiers: [42, 84, 250, 550],
    developmentCost: 175,
    lineSide: 'right',
    description: 'Prestigious Selamat Datang fountain circle and luxury shopping plazas.',
  },
  {
    id: 'bandara-sultan-hasanuddin',
    index: 28,
    name: 'Bandara Sultan Hasanuddin (UPG)',
    shortName: 'UPG Airport',
    type: 'TRANSPORT',
    purchasePrice: 150,
    baseRent: 25,
    rentTiers: TRANSPORT_RENT_TABLE,
    lineSide: 'right',
    description: 'Major air hub connecting Western Indonesia to Eastern Wallacea.',
  },
  {
    id: 'kawasan-mega-kuningan',
    index: 29,
    name: 'Kawasan Mega Kuningan',
    shortName: 'Mega Kuningan',
    type: 'PROPERTY',
    district: 'JAKARTA',
    purchasePrice: 320,
    baseRent: 50,
    rentTiers: [50, 100, 290, 640],
    developmentCost: 175,
    lineSide: 'right',
    description: 'The golden jewel of Indonesian real estate with diplomatic embassies.',
  },
  {
    id: 'pengumuman-publik',
    index: 30,
    name: 'Pengumuman Publik',
    shortName: 'Pengumuman',
    type: 'EVENT',
    deckType: 'CIVIC_NOTICE',
    lineSide: 'right',
    description: 'Draw a Pengumuman Publik card for government grants and national prizes.',
  },
  {
    id: 'izin-tata-kota',
    index: 31,
    name: 'Izin Tata Kota',
    shortName: 'Izin Bangun',
    type: 'FEE',
    feeAmount: 75,
    lineSide: 'right',
    description: 'Zoning & metropolitan permit fee. Pay Rp 75,000 to the treasury.',
  },
];

export function validateBoardConfiguration(tiles: BoardTile[] = BOARD_TILES): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (tiles.length !== 32) {
    errors.push(`Expected 32 spaces, found ${tiles.length}.`);
  }

  const seenIds = new Set<string>();
  const seenIndices = new Set<number>();

  tiles.forEach((tile, idx) => {
    if (tile.index !== idx) {
      errors.push(`Tile at array position ${idx} has mismatched index ${tile.index}.`);
    }
    if (seenIds.has(tile.id)) {
      errors.push(`Duplicate tile id: ${tile.id}`);
    }
    if (seenIndices.has(tile.index)) {
      errors.push(`Duplicate tile index: ${tile.index}`);
    }
    seenIds.add(tile.id);
    seenIndices.add(tile.index);
  });

  if (tiles[0]?.type !== 'START') errors.push('Tile 0 must be START (Istana Merdeka).');
  if (tiles[8]?.type !== 'HOLDING') errors.push('Tile 8 must be HOLDING (Pulau Terisolasi).');
  if (tiles[16]?.type !== 'PLAZA') errors.push('Tile 16 must be PLAZA (Alun-Alun Monas).');
  if (tiles[24]?.type !== 'GO_TO_HOLDING') errors.push('Tile 24 must be GO_TO_HOLDING (Kantor Kejaksaan).');

  const propertyCount = tiles.filter((t) => t.type === 'PROPERTY').length;
  const transportCount = tiles.filter((t) => t.type === 'TRANSPORT').length;
  const serviceCount = tiles.filter((t) => t.type === 'SERVICE').length;
  const eventCount = tiles.filter((t) => t.type === 'EVENT').length;
  const feeCount = tiles.filter((t) => t.type === 'FEE').length;

  if (propertyCount !== 18) errors.push(`Expected 18 PROPERTY tiles, found ${propertyCount}.`);
  if (transportCount !== 4) errors.push(`Expected 4 TRANSPORT tiles, found ${transportCount}.`);
  if (serviceCount !== 2) errors.push(`Expected 2 SERVICE tiles, found ${serviceCount}.`);
  if (eventCount !== 2) errors.push(`Expected 2 EVENT tiles, found ${eventCount}.`);
  if (feeCount !== 2) errors.push(`Expected 2 FEE tiles, found ${feeCount}.`);

  Object.values(DISTRICTS).forEach((district) => {
    const matching = tiles.filter((t) => t.district === district.id);
    if (matching.length !== 3) {
      errors.push(`District ${district.id} must have 3 properties, found ${matching.length}.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getTileGridPosition(index: number): {
  row: number;
  col: number;
  side: 'bottom' | 'left' | 'top' | 'right' | 'corner';
} {
  if (index === 0) return { row: 9, col: 9, side: 'corner' };
  if (index > 0 && index < 8) return { row: 9, col: 9 - index, side: 'bottom' };
  if (index === 8) return { row: 9, col: 1, side: 'corner' };
  if (index > 8 && index < 16) return { row: 9 - (index - 8), col: 1, side: 'left' };
  if (index === 16) return { row: 1, col: 1, side: 'corner' };
  if (index > 16 && index < 24) return { row: 1, col: 1 + (index - 16), side: 'top' };
  if (index === 24) return { row: 1, col: 9, side: 'corner' };
  return { row: 1 + (index - 24), col: 9, side: 'right' };
}

/**
 * Format credit points into full Rupiah currency strings:
 * e.g. 1500 -> "Rp 1,500,000"
 */
export function formatRupiah(credits: number): string {
  const fullAmount = Math.max(0, credits) * 1000;
  return `Rp ${fullAmount.toLocaleString('id-ID')}`;
}
