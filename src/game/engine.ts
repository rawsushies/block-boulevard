import {
  BOARD_TILES,
  CHARACTER_CARD_CATALOG,
  CITY_HALL_BONUS,
  DISTRICTS,
  HOLDING_BAIL_COST,
  MAX_HOLDING_ATTEMPTS,
  SERVICE_MULTIPLIERS,
  STARTING_CREDITS,
  TRANSPORT_RENT_TABLE,
  formatRupiah,
} from './boardData';
import { CITY_PULSE_CARDS, CIVIC_NOTICE_CARDS, shuffleCards } from './cardsData';
import {
  ActivityLogEntry,
  DevelopmentLevel,
  DistrictId,
  EventCard,
  GameConfig,
  GameState,
  MonopolyType,
  MonopolyVictoryInfo,
  PlayerRanking,
  PlayerState,
  PropertyState,
} from './types';

function createLog(
  turnNumber: number,
  message: string,
  category: ActivityLogEntry['category'],
  playerId?: string
): ActivityLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    turnNumber,
    playerId,
    message,
    category,
    timestamp: Date.now(),
  };
}

export function createInitialGameState(
  config: GameConfig,
  rng: () => number = Math.random
): GameState {
  const properties: Record<number, PropertyState> = {};
  BOARD_TILES.forEach((tile) => {
    if (tile.type === 'PROPERTY' || tile.type === 'TRANSPORT' || tile.type === 'SERVICE') {
      properties[tile.index] = {
        tileIndex: tile.index,
        ownerId: null,
        builtLevel: 0,
      };
    }
  });

  const players: PlayerState[] = config.players.map((p) => ({
    ...p,
    money: STARTING_CREDITS,
    position: 0,
    inHolding: false,
    holdingTurns: 0,
    freeExitCards: 0,
    isBankrupt: false,
  }));

  return {
    mode: config.mode,
    roundNumber: 1,
    quickGameMaxRounds: config.quickGameMaxRounds,
    players,
    currentPlayerIndex: 0,
    turnPhase: 'WAITING_FOR_ROLL',
    properties,
    dice: [3, 4],
    lastDiceTotal: 0,
    consecutiveDoubles: 0,
    hasExtraRoll: false,
    movementQueue: [],
    selectedTileIndex: 0,
    activeEventCard: null,
    pendingDebt: null,
    cityPulseDeck: shuffleCards(CITY_PULSE_CARDS, rng),
    cityPulseDiscard: [],
    civicNoticeDeck: shuffleCards(CIVIC_NOTICE_CARDS, rng),
    civicNoticeDiscard: [],
    logs: [
      createLog(
        1,
        `Pertandingan dimulai di Istana Merdeka! Setiap pemain mengawali dengan ${formatRupiah(STARTING_CREDITS)}.`,
        'system'
      ),
    ],
    winnerId: null,
    monopolyVictory: null,
    rankings: [],
    districtNotification: null,
  };
}

/**
 * Checks if a player owns all 3 properties of a district.
 */
export function ownsFullDistrict(
  properties: Record<number, PropertyState>,
  ownerId: string | null,
  districtId?: DistrictId
): boolean {
  if (!ownerId || !districtId) return false;
  const district = DISTRICTS[districtId];
  if (!district) return false;
  return district.tileIndices.every((idx) => properties[idx]?.ownerId === ownerId);
}

/**
 * Returns the effective development level (0, 1, 2, or 3) of a property tile.
 * - 0: Empty Lot
 * - 1: Completed District (automatic when owning all 3 in district and builtLevel === 0)
 * - 2: Business
 * - 3: Landmark
 */
export function getEffectiveDevelopmentLevel(
  properties: Record<number, PropertyState>,
  tileIndex: number
): DevelopmentLevel {
  const tile = BOARD_TILES[tileIndex];
  const prop = properties[tileIndex];
  if (!tile || !prop || tile.type !== 'PROPERTY' || !prop.ownerId) {
    return 0;
  }
  if (prop.builtLevel === 3) return 3;
  if (prop.builtLevel === 2) return 2;
  if (ownsFullDistrict(properties, prop.ownerId, tile.district)) {
    return 1;
  }
  return 0;
}

/**
 * Calculates the exact rent owed when landing on a owned property/transport/service tile.
 */
export function calculateRent(
  state: GameState,
  tileIndex: number,
  diceTotal: number = state.lastDiceTotal
): number {
  const tile = BOARD_TILES[tileIndex];
  const prop = state.properties[tileIndex];
  if (!tile || !prop || !prop.ownerId) return 0;

  if (tile.type === 'PROPERTY') {
    const level = getEffectiveDevelopmentLevel(state.properties, tileIndex);
    if (tile.rentTiers) {
      return tile.rentTiers[level];
    }
    return tile.baseRent ?? 0;
  }

  if (tile.type === 'TRANSPORT') {
    const ownedTransports = BOARD_TILES.filter(
      (t) => t.type === 'TRANSPORT' && state.properties[t.index]?.ownerId === prop.ownerId
    ).length;
    const tierIndex = Math.max(0, Math.min(3, ownedTransports - 1));
    return TRANSPORT_RENT_TABLE[tierIndex];
  }

  if (tile.type === 'SERVICE') {
    const ownedServices = BOARD_TILES.filter(
      (t) => t.type === 'SERVICE' && state.properties[t.index]?.ownerId === prop.ownerId
    ).length;
    const multiplier =
      ownedServices >= 2 ? SERVICE_MULTIPLIERS.BOTH : SERVICE_MULTIPLIERS.SINGLE;
    return diceTotal * multiplier;
  }

  return 0;
}

/**
 * Even-building rule check:
 * To upgrade a property (from Level 1 -> 2 Business, or Level 2 -> 3 Landmark):
 * 1. Player must own the full district.
 * 2. Property must not already be at Level 3 (Landmark).
 * 3. Player must have enough money for `tile.developmentCost`.
 * 4. Even-building rule: No property in the district may be developed more than 1 level above another.
 *    Specifically, you can only upgrade a property if its current effective level equals the MINIMUM
 *    effective level across the 3 properties in that district.
 */
export function canUpgradeProperty(
  state: GameState,
  playerId: string,
  tileIndex: number
): { allowed: boolean; reason?: string; cost: number } {
  const tile = BOARD_TILES[tileIndex];
  const prop = state.properties[tileIndex];
  const player = state.players.find((p) => p.id === playerId);

  if (!tile || tile.type !== 'PROPERTY' || !tile.district || !prop || !player) {
    return { allowed: false, reason: 'Not a developable district property.', cost: 0 };
  }
  const cost = tile.developmentCost ?? 0;

  if (player.isBankrupt) {
    return { allowed: false, reason: 'Player is eliminated.', cost };
  }
  if (prop.ownerId !== playerId) {
    return { allowed: false, reason: 'You do not own this property.', cost };
  }
  if (!ownsFullDistrict(state.properties, playerId, tile.district)) {
    return { allowed: false, reason: 'Own all 3 properties in this district to build.', cost };
  }

  const currentLevel = getEffectiveDevelopmentLevel(state.properties, tileIndex);
  if (currentLevel >= 3) {
    return { allowed: false, reason: 'Maximum Landmark level reached.', cost };
  }

  const districtIndices = DISTRICTS[tile.district].tileIndices;
  const levels = districtIndices.map((idx) =>
    getEffectiveDevelopmentLevel(state.properties, idx)
  );
  const minLevel = Math.min(...levels);

  if (currentLevel > minLevel) {
    return {
      allowed: false,
      reason: 'Even-building rule: develop other properties in this district first.',
      cost,
    };
  }

  if (player.money < cost) {
    return { allowed: false, reason: `Dana tidak cukup (${formatRupiah(cost)} diperlukan).`, cost };
  }

  return { allowed: true, cost };
}

/**
 * Even-selling rule check:
 * A player can sell a development (Level 3 -> 2, or Level 2 -> 1) for 50% of `developmentCost`.
 * Respects even-selling within the district: you must sell from the highest-developed property in the district first.
 */
export function canSellDevelopment(
  state: GameState,
  playerId: string,
  tileIndex: number
): { allowed: boolean; reason?: string; refund: number } {
  const tile = BOARD_TILES[tileIndex];
  const prop = state.properties[tileIndex];
  if (!tile || tile.type !== 'PROPERTY' || !tile.district || !prop) {
    return { allowed: false, reason: 'Invalid property.', refund: 0 };
  }
  const refund = Math.floor((tile.developmentCost ?? 0) / 2);

  if (prop.ownerId !== playerId) {
    return { allowed: false, reason: 'You do not own this property.', refund };
  }

  const currentLevel = getEffectiveDevelopmentLevel(state.properties, tileIndex);
  if (currentLevel < 2) {
    return { allowed: false, reason: 'No constructed developments to sell.', refund };
  }

  const districtIndices = DISTRICTS[tile.district].tileIndices;
  const levels = districtIndices.map((idx) =>
    getEffectiveDevelopmentLevel(state.properties, idx)
  );
  const maxLevel = Math.max(...levels);

  if (currentLevel < maxLevel) {
    return {
      allowed: false,
      reason: 'Even-selling rule: sell from the highest-level property in this district first.',
      refund,
    };
  }

  return { allowed: true, refund };
}

/**
 * Upgrades a property by 1 development level (Level 1 -> 2 Business, or Level 2 -> 3 Landmark).
 */
export function upgradePropertyAction(
  state: GameState,
  playerId: string,
  tileIndex: number
): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return state;

  const check = canUpgradeProperty(state, playerId, tileIndex);
  if (!check.allowed) return state;

  const tile = BOARD_TILES[tileIndex];
  const currentLevel = getEffectiveDevelopmentLevel(state.properties, tileIndex);
  const nextBuiltLevel: 2 | 3 = currentLevel === 1 ? 2 : 3;
  const levelLabel = nextBuiltLevel === 2 ? 'Business' : 'Landmark';

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, money: p.money - check.cost } : p
  );

  const updatedProperties: Record<number, PropertyState> = {
    ...state.properties,
    [tileIndex]: {
      ...state.properties[tileIndex],
      builtLevel: nextBuiltLevel,
    },
  };

  return {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    selectedTileIndex: tileIndex,
    logs: [
      createLog(
        state.roundNumber,
        `${currentPlayer.name} membangun ${levelLabel === 'Business' ? 'Paviliun Joglo' : 'Landmark'} di ${tile.name} seharga ${formatRupiah(check.cost)}.`,
        'development',
        playerId
      ),
      ...state.logs,
    ],
  };
}

/**
 * Sells 1 development level back to the bank for 50% refund.
 * If the player had a pending debt and now has enough cash to pay it, automatically settles the debt!
 */
export function sellDevelopmentAction(
  state: GameState,
  playerId: string,
  tileIndex: number
): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return state;

  const check = canSellDevelopment(state, playerId, tileIndex);
  if (!check.allowed) return state;

  const tile = BOARD_TILES[tileIndex];
  const currentLevel = getEffectiveDevelopmentLevel(state.properties, tileIndex);
  const nextBuiltLevel: 0 | 2 = currentLevel === 3 ? 2 : 0;
  const soldLabel = currentLevel === 3 ? 'Landmark' : 'Business';

  const updatedPlayers = state.players.map((p) =>
    p.id === playerId ? { ...p, money: p.money + check.refund } : p
  );

  const updatedProperties: Record<number, PropertyState> = {
    ...state.properties,
    [tileIndex]: {
      ...state.properties[tileIndex],
      builtLevel: nextBuiltLevel,
    },
  };

  let nextState: GameState = {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    selectedTileIndex: tileIndex,
    logs: [
      createLog(
        state.roundNumber,
        `${currentPlayer.name} menjual ${soldLabel === 'Business' ? 'Paviliun Joglo' : 'Landmark'} di ${tile.name} seharga ${formatRupiah(check.refund)}.`,
        'development',
        playerId
      ),
      ...state.logs,
    ],
  };

  // If in DEBT_RESOLUTION and player now has enough money to pay pendingDebt, settle it!
  if (nextState.turnPhase === 'DEBT_RESOLUTION' && nextState.pendingDebt) {
    const refreshedPlayer = nextState.players[nextState.currentPlayerIndex];
    if (refreshedPlayer.money >= nextState.pendingDebt.amount) {
      nextState = settlePendingDebt(nextState);
    }
  }

  return nextState;
}

/**
 * Pays 50 credits (or uses a Free Exit Card) to leave Holding Yard before rolling.
 */
export function leaveHoldingBeforeRollAction(
  state: GameState,
  useCard: boolean = false
): GameState {
  if (state.turnPhase !== 'WAITING_FOR_ROLL') return state;
  const player = state.players[state.currentPlayerIndex];
  if (!player || !player.inHolding) return state;

  if (useCard && player.freeExitCards > 0) {
    const updatedPlayers = state.players.map((p, idx) =>
      idx === state.currentPlayerIndex
        ? { ...p, inHolding: false, holdingTurns: 0, freeExitCards: p.freeExitCards - 1 }
        : p
    );
    return {
      ...state,
      players: updatedPlayers,
      logs: [
        createLog(
          state.roundNumber,
          `${player.name} menggunakan Tiket Bebas Pulau untuk melanjutkan perjalanan.`,
          'holding',
          player.id
        ),
        ...state.logs,
      ],
    };
  }

  if (player.money < HOLDING_BAIL_COST) return state;

  const updatedPlayers = state.players.map((p, idx) =>
    idx === state.currentPlayerIndex
      ? { ...p, money: p.money - HOLDING_BAIL_COST, inHolding: false, holdingTurns: 0 }
      : p
  );

  return {
    ...state,
    players: updatedPlayers,
    logs: [
      createLog(
        state.roundNumber,
        `${player.name} membayar retribusi ${formatRupiah(HOLDING_BAIL_COST)} untuk keluar dari Pulau Terisolasi.`,
        'holding',
        player.id
      ),
      ...state.logs,
    ],
  };
}

/**
 * Builds step-by-step tile indices for forward or backward movement around the 32-tile perimeter.
 */
export function buildMovementQueue(startPos: number, steps: number): number[] {
  const queue: number[] = [];
  if (steps === 0) return queue;
  const direction = steps > 0 ? 1 : -1;
  const count = Math.abs(steps);
  let current = startPos;
  for (let i = 0; i < count; i++) {
    current = (current + direction + 32) % 32;
    queue.push(current);
  }
  return queue;
}

/**
 * Rolls two 6-sided dice and transitions to MOVING (or Holding Yard resolution).
 * Pass explicit `fixedDice` in unit tests for deterministic assertions.
 */
export function rollDiceAction(
  state: GameState,
  fixedDice?: [number, number]
): GameState {
  if (state.turnPhase !== 'WAITING_FOR_ROLL' && state.turnPhase !== 'EXTRA_ROLL') {
    return state;
  }

  const player = state.players[state.currentPlayerIndex];
  if (!player || player.isBankrupt) return state;

  const d1 = fixedDice ? fixedDice[0] : Math.floor(Math.random() * 6) + 1;
  const d2 = fixedDice ? fixedDice[1] : Math.floor(Math.random() * 6) + 1;
  const total = d1 + d2;
  const isDoubles = d1 === d2;

  // Case 1: Player is currently in Holding Yard
  if (player.inHolding) {
    if (isDoubles) {
      // Escapes Holding Yard by rolling doubles! Does NOT receive an extra roll from this escape.
      const queue = buildMovementQueue(player.position, total);
      const updatedPlayers = state.players.map((p, idx) =>
        idx === state.currentPlayerIndex
          ? { ...p, inHolding: false, holdingTurns: 0 }
          : p
      );
      return {
        ...state,
        players: updatedPlayers,
        dice: [d1, d2],
        lastDiceTotal: total,
        consecutiveDoubles: 0,
        hasExtraRoll: false,
        movementQueue: queue,
        turnPhase: 'MOVING',
        logs: [
          createLog(
            state.roundNumber,
            `${player.name} rolled doubles (${d1} + ${d2} = ${total}) and cleared Holding Yard!`,
            'holding',
            player.id
          ),
          ...state.logs,
        ],
      };
    }

    // Did not roll doubles in Holding Yard
    const attempts = player.holdingTurns + 1;
    if (attempts >= MAX_HOLDING_ATTEMPTS) {
      // Automatically leaves after 3 unsuccessful attempts and moves the rolled total
      const fee = Math.min(player.money, HOLDING_BAIL_COST);
      const queue = buildMovementQueue(player.position, total);
      const updatedPlayers = state.players.map((p, idx) =>
        idx === state.currentPlayerIndex
          ? {
              ...p,
              money: p.money - fee,
              inHolding: false,
              holdingTurns: 0,
            }
          : p
      );
      return {
        ...state,
        players: updatedPlayers,
        dice: [d1, d2],
        lastDiceTotal: total,
        consecutiveDoubles: 0,
        hasExtraRoll: false,
        movementQueue: queue,
        turnPhase: 'MOVING',
        logs: [
          createLog(
            state.roundNumber,
            `${player.name} completed 3 Holding Yard attempts (rolled ${d1} + ${d2} = ${total}) and resumed movement.`,
            'holding',
            player.id
          ),
          ...state.logs,
        ],
      };
    }

    // Remains in Holding Yard for this turn
    const updatedPlayers = state.players.map((p, idx) =>
      idx === state.currentPlayerIndex ? { ...p, holdingTurns: attempts } : p
    );
    return {
      ...state,
      players: updatedPlayers,
      dice: [d1, d2],
      lastDiceTotal: total,
      consecutiveDoubles: 0,
      hasExtraRoll: false,
      movementQueue: [],
      turnPhase: 'MANAGING_PROPERTIES',
      logs: [
        createLog(
          state.roundNumber,
          `${player.name} rolled ${d1} + ${d2} (no doubles) — remains in Holding Yard (attempt ${attempts}/${MAX_HOLDING_ATTEMPTS}).`,
          'holding',
          player.id
        ),
        ...state.logs,
      ],
    };
  }

  // Case 2: Normal movement (not in Holding Yard)
  const newConsecutiveDoubles = isDoubles ? state.consecutiveDoubles + 1 : 0;

  // Three consecutive doubles send the player directly to Holding Yard!
  if (newConsecutiveDoubles >= 3) {
    const updatedPlayers = state.players.map((p, idx) =>
      idx === state.currentPlayerIndex
        ? { ...p, position: 8, inHolding: true, holdingTurns: 0 }
        : p
    );
    return {
      ...state,
      players: updatedPlayers,
      dice: [d1, d2],
      lastDiceTotal: total,
      consecutiveDoubles: 0,
      hasExtraRoll: false,
      movementQueue: [],
      selectedTileIndex: 8,
      turnPhase: 'MANAGING_PROPERTIES',
      logs: [
        createLog(
          state.roundNumber,
          `${player.name} rolled three consecutive doubles (${d1} + ${d2}) and was sent to Holding Yard!`,
          'holding',
          player.id
        ),
        ...state.logs,
      ],
    };
  }

  const queue = buildMovementQueue(player.position, total);

  return {
    ...state,
    dice: [d1, d2],
    lastDiceTotal: total,
    consecutiveDoubles: newConsecutiveDoubles,
    hasExtraRoll: isDoubles,
    movementQueue: queue,
    turnPhase: 'MOVING',
    districtNotification: null,
    logs: [
      createLog(
        state.roundNumber,
        `${player.name} rolled ${d1} + ${d2} = ${total}${isDoubles ? ' (Doubles!)' : ''}.`,
        'roll',
        player.id
      ),
      ...state.logs,
    ],
  };
}

/**
 * Advances the active player by 1 tile from `movementQueue`.
 * Awards 200 credits whenever passing or landing on City Hall (index 0).
 * When `movementQueue` becomes empty, automatically resolves the destination tile.
 */
export function advanceMovementStepAction(state: GameState): GameState {
  if (state.turnPhase !== 'MOVING') return state;
  if (state.movementQueue.length === 0) {
    return resolveCurrentTile(state);
  }

  const [nextTileIndex, ...remainingQueue] = state.movementQueue;
  const player = state.players[state.currentPlayerIndex];
  const passedOrLandedCityHall = nextTileIndex === 0;

  const updatedPlayers = state.players.map((p, idx) =>
    idx === state.currentPlayerIndex
      ? {
          ...p,
          position: nextTileIndex,
          money: passedOrLandedCityHall ? p.money + CITY_HALL_BONUS : p.money,
        }
      : p
  );

  const logs = passedOrLandedCityHall
    ? [
        createLog(
          state.roundNumber,
          `${player.name} menerima bonus ${formatRupiah(CITY_HALL_BONUS)} di Istana Merdeka!`,
          'system',
          player.id
        ),
        ...state.logs,
      ]
    : state.logs;

  const steppedState: GameState = {
    ...state,
    players: updatedPlayers,
    movementQueue: remainingQueue,
    selectedTileIndex: nextTileIndex,
    logs,
  };

  if (remainingQueue.length === 0) {
    return resolveCurrentTile(steppedState);
  }

  return steppedState;
}

/**
 * Resolves all remaining steps immediately (useful for fast unit tests or instant movement fallback).
 */
export function flushMovementQueue(state: GameState): GameState {
  let current = state;
  let safety = 0;
  while (current.turnPhase === 'MOVING' && safety < 40) {
    current = advanceMovementStepAction(current);
    safety++;
  }
  return current;
}

/**
 * Resolves the space where the current player has landed.
 */
export function resolveCurrentTile(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  if (!player) return state;
  const tile = BOARD_TILES[player.position];
  if (!tile) return state;

  const baseState: GameState = {
    ...state,
    selectedTileIndex: tile.index,
  };

  // 1. Corners: START, HOLDING, PLAZA
  if (tile.type === 'START' || tile.type === 'HOLDING' || tile.type === 'PLAZA') {
    return {
      ...baseState,
      turnPhase: baseState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
    };
  }

  // 2. GO_TO_HOLDING (Enforcement Office, tile 24)
  if (tile.type === 'GO_TO_HOLDING') {
    const updatedPlayers = baseState.players.map((p, idx) =>
      idx === baseState.currentPlayerIndex
        ? { ...p, position: 8, inHolding: true, holdingTurns: 0 }
        : p
    );
    return {
      ...baseState,
      players: updatedPlayers,
      selectedTileIndex: 8,
      hasExtraRoll: false,
      consecutiveDoubles: 0,
      turnPhase: 'MANAGING_PROPERTIES',
      logs: [
        createLog(
          baseState.roundNumber,
          `${player.name} landed on Enforcement Office and was sent directly to Holding Yard!`,
          'holding',
          player.id
        ),
        ...baseState.logs,
      ],
    };
  }

  // 3. Purchasable Properties, Transports, Services
  if (tile.type === 'PROPERTY' || tile.type === 'TRANSPORT' || tile.type === 'SERVICE') {
    const prop = baseState.properties[tile.index];
    if (!prop.ownerId) {
      // Unowned -> Player decides BUY or PASS
      return {
        ...baseState,
        turnPhase: 'BUY_OR_PASS',
      };
    }

    if (prop.ownerId === player.id) {
      // Owned by self -> no rent
      return {
        ...baseState,
        turnPhase: baseState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
      };
    }

    // Owned by another active player -> Calculate and pay rent
    const owner = baseState.players.find((p) => p.id === prop.ownerId);
    if (!owner || owner.isBankrupt) {
      return {
        ...baseState,
        turnPhase: baseState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
      };
    }

    const rawRent = calculateRent(baseState, tile.index, baseState.lastDiceTotal);
    const payerCard = CHARACTER_CARD_CATALOG.find((c) => c.id === player.cardId);
    const discount = payerCard?.tollDiscount ?? 0;
    const finalRent = discount > 0 ? Math.max(0, Math.floor(rawRent * (1 - discount / 100))) : rawRent;
    const rentReason = discount > 0
      ? `sewa ${tile.name} ke ${owner.name} (Diskon Toll ${discount}% aktif: ${formatRupiah(finalRent)})`
      : `sewa ${tile.name} ke ${owner.name} (${formatRupiah(finalRent)})`;
    return applyPaymentOrDebt(
      baseState,
      owner.id,
      finalRent,
      rentReason,
      'rent'
    );
  }

  // 4. City Fee spaces
  if (tile.type === 'FEE') {
    const fee = tile.feeAmount ?? 75;
    return applyPaymentOrDebt(
      baseState,
      null,
      fee,
      `${tile.name} (${formatRupiah(fee)})`,
      'event'
    );
  }

  // 5. Event spaces (City Pulse / Civic Notice)
  if (tile.type === 'EVENT') {
    return drawEventCard(baseState, tile.deckType ?? 'CITY_PULSE');
  }

  return {
    ...baseState,
    turnPhase: baseState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
  };
}

/**
 * Helper to charge the active player `amount` to `creditorId` (or bank if null).
 * If the player has enough cash, deducts immediately and transitions to EXTRA_ROLL / MANAGING_PROPERTIES.
 * If the player lacks cash, enters `DEBT_RESOLUTION` so they can sell developments or declare bankruptcy.
 */
function applyPaymentOrDebt(
  state: GameState,
  creditorId: string | null,
  amount: number,
  reason: string,
  logCategory: ActivityLogEntry['category']
): GameState {
  const payer = state.players[state.currentPlayerIndex];
  const creditor = creditorId ? state.players.find((p) => p.id === creditorId) : null;

  if (payer.money >= amount) {
    const updatedPlayers = state.players.map((p) => {
      if (p.id === payer.id) return { ...p, money: p.money - amount };
      if (creditor && p.id === creditor.id) return { ...p, money: p.money + amount };
      return p;
    });

    const msg = creditor
      ? `${payer.name} membayar ${formatRupiah(amount)} untuk ${reason}.`
      : `${payer.name} membayar ${formatRupiah(amount)} untuk ${reason}.`;

    return {
      ...state,
      players: updatedPlayers,
      pendingDebt: null,
      turnPhase: state.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
      logs: [createLog(state.roundNumber, msg, logCategory, payer.id), ...state.logs],
    };
  }

  // Player cannot afford payment with current cash -> enter DEBT_RESOLUTION
  return {
    ...state,
    pendingDebt: {
      creditorId,
      amount,
      reason,
    },
    turnPhase: 'DEBT_RESOLUTION',
    logs: [
      createLog(
        state.roundNumber,
        `${payer.name} berutang ${formatRupiah(amount)} untuk ${reason} namun hanya memiliki saldo ${formatRupiah(payer.money)}!`,
        'bankruptcy',
        payer.id
      ),
      ...state.logs,
    ],
  };
}

function settlePendingDebt(state: GameState): GameState {
  if (!state.pendingDebt) return state;
  const { creditorId, amount, reason } = state.pendingDebt;
  return applyPaymentOrDebt(
    { ...state, pendingDebt: null },
    creditorId,
    amount,
    reason,
    creditorId ? 'rent' : 'event'
  );
}

/**
 * Purchases the unowned property the current player is standing on.
 */
export function buyPropertyAction(state: GameState): GameState {
  if (state.turnPhase !== 'BUY_OR_PASS') return state;
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.isBankrupt) return state;

  const tile = BOARD_TILES[player.position];
  const prop = state.properties[player.position];
  if (!tile || !prop || prop.ownerId !== null) return state;

  const price = tile.purchasePrice ?? 0;
  if (player.money < price) return state;

  const updatedPlayers = state.players.map((p, idx) =>
    idx === state.currentPlayerIndex ? { ...p, money: p.money - price } : p
  );

  const updatedProperties: Record<number, PropertyState> = {
    ...state.properties,
    [tile.index]: {
      ...prop,
      ownerId: player.id,
      builtLevel: 0,
    },
  };

  const completedDistrictNow =
    tile.type === 'PROPERTY' &&
    tile.district &&
    ownsFullDistrict(updatedProperties, player.id, tile.district);

  const logs: ActivityLogEntry[] = [
    createLog(
      state.roundNumber,
      `${player.name} membeli properti ${tile.name} seharga ${formatRupiah(price)}.`,
      'purchase',
      player.id
    ),
    ...state.logs,
  ];

  let districtNotification = state.districtNotification;
  if (completedDistrictNow && tile.district) {
    const dInfo = DISTRICTS[tile.district];
    logs.unshift(
      createLog(
        state.roundNumber,
        `${player.name} melengkapi distrik ${dInfo.name}! Biaya sewa dasar digandakan & izin pembangunan dibuka.`,
        'development',
        player.id
      )
    );
    districtNotification = {
      playerId: player.id,
      playerName: player.name,
      districtId: tile.district,
      districtName: dInfo.name,
    };
  }

  // Check instant monopoly win conditions
  const monopolyVictory = checkMonopolyWinConditions({
    ...state,
    properties: updatedProperties,
    players: updatedPlayers,
  });

  if (monopolyVictory) {
    return applyMonopolyVictory(
      {
        ...state,
        players: updatedPlayers,
        properties: updatedProperties,
        districtNotification,
        logs,
      },
      monopolyVictory
    );
  }

  return {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    districtNotification,
    turnPhase: state.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
    logs,
  };
}

export const SIDE_PURCHASABLE_TILES: Record<'bottom' | 'left' | 'top' | 'right', number[]> = {
  bottom: [1, 2, 3, 4, 5, 6, 7],
  left: [9, 10, 11, 12, 13, 14, 15],
  top: [17, 18, 19, 20, 21],
  right: [25, 26, 27, 28, 29],
};

export const AIRPORT_INDICES = [3, 12, 21, 28];

export function checkMonopolyWinConditions(state: GameState): MonopolyVictoryInfo | null {
  const activePlayers = state.players.filter((p) => !p.isBankrupt);

  for (const player of activePlayers) {
    // 1. Line Monopoly check
    for (const [sideKey, indices] of Object.entries(SIDE_PURCHASABLE_TILES)) {
      const ownsAll = indices.every(
        (idx) => state.properties[idx]?.ownerId === player.id
      );
      if (ownsAll) {
        const sideLabel =
          sideKey === 'bottom'
            ? 'Sumatera-Bandung (Sisi Bawah)'
            : sideKey === 'left'
            ? 'Surabaya-Makassar (Sisi Kiri)'
            : sideKey === 'top'
            ? 'Denpasar & Energi (Sisi Atas)'
            : 'Jakarta Metropolitan (Sisi Kanan)';
        return {
          type: 'LINE_MONOPOLY',
          winnerId: player.id,
          winnerName: player.name,
          multiplier: 5,
          title: 'LINE MONOPOLY! (5x Skor)',
          description: `${player.name} berhasil menguasai seluruh properti di jalur ${sideLabel}! Kemenangan mutlak!`,
        };
      }
    }

    // 2. Tourism Monopoly check (All 4 airports)
    const ownsAllAirports = AIRPORT_INDICES.every(
      (idx) => state.properties[idx]?.ownerId === player.id
    );
    if (ownsAllAirports) {
      return {
        type: 'TOURISM_MONOPOLY',
        winnerId: player.id,
        winnerName: player.name,
        multiplier: 5,
        title: 'TOURISM MONOPOLY! (5x Skor)',
        description: `${player.name} berhasil menguasai 4 gerbang bandara nusantara (CGK, SUB, DPS, UPG)! Monopoli pariwisata tercapai!`,
      };
    }

    // 3. Triple Monopoly check (3 complete color districts)
    const completedDistricts = (Object.keys(DISTRICTS) as DistrictId[]).filter((dId) =>
      ownsFullDistrict(state.properties, player.id, dId)
    );
    if (completedDistricts.length >= 3) {
      const districtNames = completedDistricts.map((d) => DISTRICTS[d].name).join(', ');
      return {
        type: 'TRIPLE_MONOPOLY',
        winnerId: player.id,
        winnerName: player.name,
        multiplier: 3,
        title: 'TRIPLE MONOPOLY! (3x Skor)',
        description: `${player.name} telah mendominasi 3 distrik kota (${districtNames})! Kemenangan instan!`,
      };
    }
  }

  return null;
}

export function applyMonopolyVictory(
  state: GameState,
  monopolyInfo: MonopolyVictoryInfo
): GameState {
  const rankings = calculateMatchRankings(state);
  return {
    ...state,
    turnPhase: 'GAME_OVER',
    winnerId: monopolyInfo.winnerId,
    monopolyVictory: monopolyInfo,
    rankings,
    logs: [
      createLog(
        state.roundNumber,
        `👑 ${monopolyInfo.title} - ${monopolyInfo.description}`,
        'monopoly',
        monopolyInfo.winnerId
      ),
      ...state.logs,
    ],
  };
}

export function rollDiceWithGaugeAction(
  state: GameState,
  powerRatio: number
): GameState {
  if (state.turnPhase !== 'WAITING_FOR_ROLL' && state.turnPhase !== 'EXTRA_ROLL') {
    return state;
  }
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.isBankrupt) return state;

  const card = CHARACTER_CARD_CATALOG.find((c) => c.id === player.cardId);
  const diceControlChance = card?.diceControl ?? 75;

  let targetSums: number[];
  let zoneLabel: string;
  if (powerRatio < 0.25) {
    targetSums = [2, 3, 4];
    zoneLabel = 'LOW (2-4)';
  } else if (powerRatio < 0.50) {
    targetSums = [5, 6, 7];
    zoneLabel = 'MID-LOW (5-7)';
  } else if (powerRatio < 0.75) {
    targetSums = [8, 9];
    zoneLabel = 'MID-HIGH (8-9)';
  } else {
    targetSums = [10, 11, 12];
    zoneLabel = 'HIGH (10-12)';
  }

  const dcActivated = Math.random() * 100 < diceControlChance;
  let d1: number;
  let d2: number;

  if (dcActivated) {
    const targetSum = targetSums[Math.floor(Math.random() * targetSums.length)];
    const validPairs: [number, number][] = [];
    for (let a = 1; a <= 6; a++) {
      const b = targetSum - a;
      if (b >= 1 && b <= 6) {
        validPairs.push([a, b]);
      }
    }
    const chosen = validPairs[Math.floor(Math.random() * validPairs.length)] || [
      Math.ceil(targetSum / 2),
      Math.floor(targetSum / 2),
    ];
    d1 = chosen[0];
    d2 = chosen[1];
  } else {
    d1 = Math.floor(Math.random() * 6) + 1;
    d2 = Math.floor(Math.random() * 6) + 1;
  }

  const rolledState = rollDiceAction(state, [d1, d2]);
  if (dcActivated && rolledState.logs.length > 0) {
    rolledState.logs[0].message = `🎯 [Dice Control: ${zoneLabel}] ${rolledState.logs[0].message}`;
  }
  return rolledState;
}

/**
 * Passes on purchasing the current unowned property.
 */
export function passPropertyAction(state: GameState): GameState {
  if (state.turnPhase !== 'BUY_OR_PASS') return state;
  const player = state.players[state.currentPlayerIndex];
  const tile = BOARD_TILES[player.position];

  return {
    ...state,
    turnPhase: state.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
    logs: [
      createLog(
        state.roundNumber,
        `${player.name} passed on buying ${tile.name}.`,
        'purchase',
        player.id
      ),
      ...state.logs,
    ],
  };
}

/**
 * Draws the top card from CITY_PULSE or CIVIC_NOTICE (reshuffling discard if empty)
 * and transitions to `EVENT_DECISION` so the player sees the card and clicks Continue.
 */
function drawEventCard(
  state: GameState,
  deckType: 'CITY_PULSE' | 'CIVIC_NOTICE'
): GameState {
  let deck = deckType === 'CITY_PULSE' ? [...state.cityPulseDeck] : [...state.civicNoticeDeck];
  let discard =
    deckType === 'CITY_PULSE' ? [...state.cityPulseDiscard] : [...state.civicNoticeDiscard];

  if (deck.length === 0) {
    deck = shuffleCards(discard);
    discard = [];
  }

  const card = deck.shift()!;
  discard.push(card);

  return {
    ...state,
    activeEventCard: card,
    cityPulseDeck: deckType === 'CITY_PULSE' ? deck : state.cityPulseDeck,
    cityPulseDiscard: deckType === 'CITY_PULSE' ? discard : state.cityPulseDiscard,
    civicNoticeDeck: deckType === 'CIVIC_NOTICE' ? deck : state.civicNoticeDeck,
    civicNoticeDiscard: deckType === 'CIVIC_NOTICE' ? discard : state.civicNoticeDiscard,
    turnPhase: 'EVENT_DECISION',
  };
}

/**
 * Applies the active event card's effect to the game state.
 */
export function applyEventCardAction(state: GameState): GameState {
  if (state.turnPhase !== 'EVENT_DECISION' || !state.activeEventCard) return state;

  const card = state.activeEventCard;
  const player = state.players[state.currentPlayerIndex];
  const { effect } = card;

  const clearedCardState: GameState = {
    ...state,
    activeEventCard: null,
  };

  switch (effect.type) {
    case 'GAIN_MONEY': {
      const amount = effect.amount ?? 100;
      const updatedPlayers = clearedCardState.players.map((p, idx) =>
        idx === clearedCardState.currentPlayerIndex ? { ...p, money: p.money + amount } : p
      );
      return {
        ...clearedCardState,
        players: updatedPlayers,
        turnPhase: clearedCardState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
        logs: [
          createLog(
            clearedCardState.roundNumber,
            `${player.name} menarik "${card.title}" dan memperoleh ${formatRupiah(amount)}.`,
            'event',
            player.id
          ),
          ...clearedCardState.logs,
        ],
      };
    }

    case 'PAY_MONEY': {
      const amount = effect.amount ?? 50;
      return applyPaymentOrDebt(
        clearedCardState,
        null,
        amount,
        `"${card.title}"`,
        'event'
      );
    }

    case 'FREE_EXIT_CARD': {
      const updatedPlayers = clearedCardState.players.map((p, idx) =>
        idx === clearedCardState.currentPlayerIndex
          ? { ...p, freeExitCards: p.freeExitCards + 1 }
          : p
      );
      return {
        ...clearedCardState,
        players: updatedPlayers,
        turnPhase: clearedCardState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
        logs: [
          createLog(
            clearedCardState.roundNumber,
            `${player.name} menerima Tiket Bebas Pulau ("${card.title}").`,
            'event',
            player.id
          ),
          ...clearedCardState.logs,
        ],
      };
    }

    case 'GO_TO_HOLDING': {
      const updatedPlayers = clearedCardState.players.map((p, idx) =>
        idx === clearedCardState.currentPlayerIndex
          ? { ...p, position: 8, inHolding: true, holdingTurns: 0 }
          : p
      );
      return {
        ...clearedCardState,
        players: updatedPlayers,
        selectedTileIndex: 8,
        hasExtraRoll: false,
        consecutiveDoubles: 0,
        turnPhase: 'MANAGING_PROPERTIES',
        logs: [
          createLog(
            clearedCardState.roundNumber,
            `${player.name} menarik "${card.title}" dan dikirim ke Pulau Terisolasi!`,
            'holding',
            player.id
          ),
          ...clearedCardState.logs,
        ],
      };
    }

    case 'MOVE_STEPS': {
      const steps = effect.steps ?? 0;
      const queue = buildMovementQueue(player.position, steps);
      return {
        ...clearedCardState,
        movementQueue: queue,
        turnPhase: 'MOVING',
        logs: [
          createLog(
            clearedCardState.roundNumber,
            `${player.name} menarik "${card.title}" dan melangkah ${steps > 0 ? `maju ${steps}` : `mundur ${Math.abs(steps)}`} petak.`,
            'event',
            player.id
          ),
          ...clearedCardState.logs,
        ],
      };
    }

    case 'MOVE_TO_TILE': {
      const target = effect.targetTileIndex ?? 0;
      const forwardSteps = (target - player.position + 32) % 32 || 32;
      const queue = buildMovementQueue(player.position, forwardSteps);
      return {
        ...clearedCardState,
        movementQueue: queue,
        turnPhase: 'MOVING',
        logs: [
          createLog(
            clearedCardState.roundNumber,
            `${player.name} menarik "${card.title}" dan terbang menuju ${BOARD_TILES[target].name}.`,
            'event',
            player.id
          ),
          ...clearedCardState.logs,
        ],
      };
    }

    case 'COLLECT_FROM_ALL': {
      const perPlayer = effect.amount ?? 30;
      let totalCollected = 0;
      const updatedPlayers = clearedCardState.players.map((p) => {
        if (p.id === player.id || p.isBankrupt) return p;
        const payment = Math.min(p.money, perPlayer);
        totalCollected += payment;
        return { ...p, money: p.money - payment };
      }).map((p) =>
        p.id === player.id ? { ...p, money: p.money + totalCollected } : p
      );

      return {
        ...clearedCardState,
        players: updatedPlayers,
        turnPhase: clearedCardState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
        logs: [
          createLog(
            clearedCardState.roundNumber,
            `${player.name} menarik "${card.title}" dan mengumpulkan ${formatRupiah(totalCollected)} dari pemain lain.`,
            'event',
            player.id
          ),
          ...clearedCardState.logs,
        ],
      };
    }

    case 'PAY_EACH_PLAYER': {
      const perPlayer = effect.amount ?? 25;
      const activeOthers = clearedCardState.players.filter(
        (p) => p.id !== player.id && !p.isBankrupt
      );
      const totalRequired = perPlayer * activeOthers.length;

      if (player.money >= totalRequired) {
        const updatedPlayers = clearedCardState.players.map((p) => {
          if (p.id === player.id) return { ...p, money: p.money - totalRequired };
          if (!p.isBankrupt) return { ...p, money: p.money + perPlayer };
          return p;
        });
        return {
          ...clearedCardState,
          players: updatedPlayers,
          turnPhase: clearedCardState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
          logs: [
            createLog(
              clearedCardState.roundNumber,
              `${player.name} menarik "${card.title}" dan membagikan ${formatRupiah(perPlayer)} ke tiap pemain (${formatRupiah(totalRequired)} total).`,
              'event',
              player.id
            ),
            ...clearedCardState.logs,
          ],
        };
      }

      return applyPaymentOrDebt(
        clearedCardState,
        null,
        totalRequired,
        `"${card.title}" (${formatRupiah(perPlayer)} per pemain)`,
        'event'
      );
    }

    default:
      return {
        ...clearedCardState,
        turnPhase: clearedCardState.hasExtraRoll ? 'EXTRA_ROLL' : 'MANAGING_PROPERTIES',
      };
  }
}

/**
 * Returns total resale value of all developments owned by `playerId`.
 */
export function getLiquidationValue(state: GameState, playerId: string): number {
  let total = 0;
  Object.values(state.properties).forEach((prop) => {
    if (prop.ownerId === playerId && prop.builtLevel >= 2) {
      const tile = BOARD_TILES[prop.tileIndex];
      const refundPerLevel = Math.floor((tile.developmentCost ?? 0) / 2);
      const constructedCount = prop.builtLevel === 3 ? 2 : 1;
      total += refundPerLevel * constructedCount;
    }
  });
  return total;
}

/**
 * Declares bankruptcy for the current player when they cannot pay a debt.
 * Returns all their properties to the bank (unowned, builtLevel = 0),
 * transfers any remaining cash to the creditor (if applicable), and checks if the match has ended.
 */
export function declareBankruptcyAction(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.isBankrupt) return state;

  const creditorId = state.pendingDebt?.creditorId ?? null;
  const leftoverCash = Math.max(0, player.money);
  const bankruptCount = state.players.filter((p) => p.isBankrupt).length;

  const updatedPlayers = state.players.map((p) => {
    if (p.id === player.id) {
      return {
        ...p,
        money: 0,
        isBankrupt: true,
        inHolding: false,
        bankruptOrder: bankruptCount + 1,
      };
    }
    if (creditorId && p.id === creditorId) {
      return {
        ...p,
        money: p.money + leftoverCash,
      };
    }
    return p;
  });

  // Return all of the bankrupt player's properties to the city bank
  const updatedProperties: Record<number, PropertyState> = { ...state.properties };
  Object.keys(updatedProperties).forEach((key) => {
    const idx = Number(key);
    if (updatedProperties[idx].ownerId === player.id) {
      updatedProperties[idx] = {
        tileIndex: idx,
        ownerId: null,
        builtLevel: 0,
      };
    }
  });

  const nextLogs: ActivityLogEntry[] = [
    createLog(
      state.roundNumber,
      `${player.name} declared bankruptcy! All owned properties have been returned to the city.`,
      'bankruptcy',
      player.id
    ),
    ...state.logs,
  ];

  const intermediateState: GameState = {
    ...state,
    players: updatedPlayers,
    properties: updatedProperties,
    pendingDebt: null,
    hasExtraRoll: false,
    consecutiveDoubles: 0,
    logs: nextLogs,
  };

  // Check if only 1 active player remains
  const survivingPlayers = intermediateState.players.filter((p) => !p.isBankrupt);
  if (survivingPlayers.length <= 1) {
    return finalizeMatch(intermediateState, survivingPlayers[0]?.id ?? null);
  }

  return advanceToNextPlayer(intermediateState);
}

/**
 * Calculates net worth and full asset breakdown for every player, sorted by final standing.
 */
export function calculateMatchRankings(state: GameState): PlayerRanking[] {
  const rankings: PlayerRanking[] = state.players.map((player) => {
    let propertyValue = 0;
    let developmentValue = 0;
    let propertiesOwned = 0;

    Object.values(state.properties).forEach((prop) => {
      if (prop.ownerId === player.id) {
        const tile = BOARD_TILES[prop.tileIndex];
        propertiesOwned += 1;
        propertyValue += tile.purchasePrice ?? 0;
        if (prop.builtLevel >= 2) {
          const levelsBuilt = prop.builtLevel === 3 ? 2 : 1;
          const resalePerLevel = Math.floor((tile.developmentCost ?? 0) / 2);
          developmentValue += levelsBuilt * resalePerLevel;
        }
      }
    });

    const completedDistricts = (Object.keys(DISTRICTS) as DistrictId[]).filter((dId) =>
      ownsFullDistrict(state.properties, player.id, dId)
    );

    const netWorth = player.isBankrupt
      ? 0
      : player.money + propertyValue + developmentValue;

    return {
      playerId: player.id,
      name: player.name,
      cardId: player.cardId,
      token: player.token ?? player.cardId,
      color: player.color,
      isAI: player.isAI,
      isBankrupt: player.isBankrupt,
      cash: player.money,
      propertyValue,
      developmentValue,
      netWorth,
      propertiesOwned,
      completedDistricts,
      rank: 1,
    };
  });

  rankings.sort((a, b) => {
    if (a.isBankrupt !== b.isBankrupt) {
      return a.isBankrupt ? 1 : -1;
    }
    if (b.netWorth !== a.netWorth) {
      return b.netWorth - a.netWorth;
    }
    return b.cash - a.cash;
  });

  return rankings.map((r, idx) => ({ ...r, rank: idx + 1 }));
}

function finalizeMatch(state: GameState, explicitWinnerId?: string | null): GameState {
  const rankings = calculateMatchRankings(state);
  const winnerId = explicitWinnerId ?? rankings[0]?.playerId ?? null;
  const winner = state.players.find((p) => p.id === winnerId);

  return {
    ...state,
    turnPhase: 'GAME_OVER',
    winnerId,
    rankings,
    logs: [
      createLog(
        state.roundNumber,
        winner
          ? `Kemenangan! ${winner.name} memenangkan Block & Boulevard dengan total kekayaan ${formatRupiah(rankings[0]?.netWorth ?? 0)}!`
          : 'Pertandingan Selesai!',
        'system',
        winnerId ?? undefined
      ),
      ...state.logs,
    ],
  };
}

/**
 * Ends the current player's turn (or triggers their Extra Roll if they rolled doubles).
 */
export function endTurnAction(state: GameState): GameState {
  if (
    state.turnPhase !== 'MANAGING_PROPERTIES' &&
    state.turnPhase !== 'EXTRA_ROLL' &&
    state.turnPhase !== 'ENDING_TURN'
  ) {
    return state;
  }

  const currentPlayer = state.players[state.currentPlayerIndex];

  // If player earned an extra roll from doubles and isn't in Holding Yard
  if (state.hasExtraRoll && !currentPlayer.inHolding && !currentPlayer.isBankrupt) {
    return {
      ...state,
      hasExtraRoll: false,
      turnPhase: 'WAITING_FOR_ROLL',
      districtNotification: null,
      logs: [
        createLog(
          state.roundNumber,
          `${currentPlayer.name} takes an extra turn for rolling doubles!`,
          'roll',
          currentPlayer.id
        ),
        ...state.logs,
      ],
    };
  }

  return advanceToNextPlayer(state);
}

function advanceToNextPlayer(state: GameState): GameState {
  const survivingPlayers = state.players.filter((p) => !p.isBankrupt);
  if (survivingPlayers.length <= 1) {
    return finalizeMatch(state, survivingPlayers[0]?.id ?? null);
  }

  let nextIndex = state.currentPlayerIndex;
  let wrappedAround = false;

  for (let i = 0; i < state.players.length; i++) {
    nextIndex = (nextIndex + 1) % state.players.length;
    if (nextIndex === 0) {
      wrappedAround = true;
    }
    if (!state.players[nextIndex].isBankrupt) {
      break;
    }
  }

  // Check if we passed or reached the start of a new round
  const nextRound =
    wrappedAround || nextIndex <= state.currentPlayerIndex
      ? state.roundNumber + 1
      : state.roundNumber;

  // Check Quick Game round limit
  if (state.quickGameMaxRounds !== null && nextRound > state.quickGameMaxRounds) {
    return finalizeMatch(state);
  }

  const nextPlayer = state.players[nextIndex];
  const needsHandover = state.mode === 'LOCAL_FRIENDS' && !nextPlayer.isAI;

  return {
    ...state,
    roundNumber: nextRound,
    currentPlayerIndex: nextIndex,
    turnPhase: needsHandover ? 'HANDOVER' : 'WAITING_FOR_ROLL',
    consecutiveDoubles: 0,
    hasExtraRoll: false,
    movementQueue: [],
    activeEventCard: null,
    pendingDebt: null,
    districtNotification: null,
    selectedTileIndex: nextPlayer.position,
  };
}

/**
 * Confirms the handover screen in Local Friends mode so the next human player starts their turn.
 */
export function confirmHandoverAction(state: GameState): GameState {
  if (state.turnPhase !== 'HANDOVER') return state;
  return {
    ...state,
    turnPhase: 'WAITING_FOR_ROLL',
  };
}
