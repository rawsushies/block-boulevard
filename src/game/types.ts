export type TileType =
  | 'START'
  | 'PROPERTY'
  | 'TRANSPORT'
  | 'SERVICE'
  | 'EVENT'
  | 'FEE'
  | 'HOLDING'
  | 'PLAZA'
  | 'GO_TO_HOLDING';

export type DistrictId =
  | 'MEDAN'
  | 'BANDUNG'
  | 'SURABAYA'
  | 'MAKASSAR'
  | 'DENPASAR'
  | 'JAKARTA';

export type DevelopmentLevel = 0 | 1 | 2 | 3;
// 0 = Empty Lot (Base Rent)
// 1 = Completed City District (Double base rent)
// 2 = Joglo Business Pavilion (Constructed building level 1)
// 3 = Landmark Tower (Constructed building level 2 - max)

export interface DistrictInfo {
  id: DistrictId;
  name: string;
  island: string;
  color: string;
  accentLight: string;
  borderHex: string;
  description: string;
  tileIndices: number[];
}

export interface BoardTile {
  id: string;
  index: number;
  name: string;
  shortName: string;
  type: TileType;
  district?: DistrictId;
  purchasePrice?: number;
  baseRent?: number;
  rentTiers?: [number, number, number, number];
  developmentCost?: number;
  feeAmount?: number;
  deckType?: 'CITY_PULSE' | 'CIVIC_NOTICE';
  description: string;
  lineSide?: 'bottom' | 'left' | 'top' | 'right';
}

export interface PropertyState {
  tileIndex: number;
  ownerId: string | null;
  builtLevel: 0 | 2 | 3;
}

export type CardTier = 'S+' | 'S' | 'A+';

export interface CharacterCard {
  id: string;
  name: string;
  title: string;
  tier: CardTier;
  color: string;
  avatarId: string;
  diceControl: number; // e.g. 85 = 85% dice control accuracy
  tollDiscount: number; // e.g. 15 = 15% discount on rent
  islandEscapeBonus: number; // bonus chance / discount
  description: string;
}

export type AIDifficulty = 'EASY' | 'NORMAL' | 'HARD';
export type TokenId = string;

export interface PlayerConfig {
  id: string;
  name: string;
  cardId: string;
  token?: string; // alias/fallback for characterCard avatar
  color: string;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

export interface PlayerState extends PlayerConfig {
  money: number;
  position: number;
  inHolding: boolean;
  holdingTurns: number;
  freeExitCards: number;
  isBankrupt: boolean;
  bankruptOrder?: number;
}

export type TurnPhase =
  | 'HANDOVER'
  | 'WAITING_FOR_ROLL'
  | 'GAUGE_CHARGING'
  | 'ROLLING'
  | 'MOVING'
  | 'RESOLVING_TILE'
  | 'BUY_OR_PASS'
  | 'PAYING_RENT'
  | 'EVENT_DECISION'
  | 'DEBT_RESOLUTION'
  | 'MANAGING_PROPERTIES'
  | 'EXTRA_ROLL'
  | 'ENDING_TURN'
  | 'GAME_OVER';

export type MonopolyType =
  | 'TRIPLE_MONOPOLY'
  | 'LINE_MONOPOLY'
  | 'TOURISM_MONOPOLY'
  | 'BANKRUPTCY'
  | 'ROUND_LIMIT';

export type EventEffectType =
  | 'GAIN_MONEY'
  | 'PAY_MONEY'
  | 'MOVE_STEPS'
  | 'MOVE_TO_TILE'
  | 'GO_TO_HOLDING'
  | 'COLLECT_FROM_ALL'
  | 'PAY_EACH_PLAYER'
  | 'FREE_EXIT_CARD';

export interface EventCardEffect {
  type: EventEffectType;
  amount?: number;
  steps?: number;
  targetTileIndex?: number;
  awardPassBonus?: boolean;
}

export interface EventCard {
  id: string;
  deck: 'CITY_PULSE' | 'CIVIC_NOTICE';
  title: string;
  description: string;
  flavor: string;
  effect: EventCardEffect;
}

export interface ActivityLogEntry {
  id: string;
  turnNumber: number;
  playerId?: string;
  message: string;
  category: 'roll' | 'purchase' | 'rent' | 'development' | 'event' | 'holding' | 'bankruptcy' | 'monopoly' | 'system';
  timestamp: number;
}

export interface PendingDebt {
  creditorId: string | null;
  amount: number;
  reason: string;
}

export type GameMode = 'QUICK_MATCH' | 'LOCAL_FRIENDS';

export interface GameConfig {
  mode: GameMode;
  players: PlayerConfig[];
  quickGameMaxRounds: number | null;
}

export interface PlayerRanking {
  playerId: string;
  name: string;
  cardId: string;
  token?: string;
  color: string;
  isAI: boolean;
  isBankrupt: boolean;
  cash: number;
  propertyValue: number;
  developmentValue: number;
  netWorth: number;
  propertiesOwned: number;
  completedDistricts: DistrictId[];
  rank: number;
}

export interface MonopolyVictoryInfo {
  type: MonopolyType;
  winnerId: string;
  winnerName: string;
  multiplier: number;
  title: string;
  description: string;
}

export interface GameState {
  mode: GameMode;
  roundNumber: number;
  quickGameMaxRounds: number | null;
  players: PlayerState[];
  currentPlayerIndex: number;
  turnPhase: TurnPhase;
  properties: Record<number, PropertyState>;
  dice: [number, number];
  lastDiceTotal: number;
  consecutiveDoubles: number;
  hasExtraRoll: boolean;
  movementQueue: number[];
  selectedTileIndex: number;
  activeEventCard: EventCard | null;
  pendingDebt: PendingDebt | null;
  cityPulseDeck: EventCard[];
  cityPulseDiscard: EventCard[];
  civicNoticeDeck: EventCard[];
  civicNoticeDiscard: EventCard[];
  logs: ActivityLogEntry[];
  winnerId: string | null;
  monopolyVictory: MonopolyVictoryInfo | null;
  rankings: PlayerRanking[];
  districtNotification: {
    playerId: string;
    playerName: string;
    districtId: DistrictId;
    districtName: string;
  } | null;
}
