import { BOARD_TILES, CHARACTER_CARD_CATALOG, DISTRICTS, HOLDING_BAIL_COST } from './boardData';
import {
  applyEventCardAction,
  buyPropertyAction,
  canSellDevelopment,
  canUpgradeProperty,
  declareBankruptcyAction,
  endTurnAction,
  leaveHoldingBeforeRollAction,
  ownsFullDistrict,
  passPropertyAction,
  rollDiceAction,
  sellDevelopmentAction,
  upgradePropertyAction,
} from './engine';
import { AIDifficulty, GameState } from './types';

/**
 * Cash reserve thresholds per AI difficulty:
 * - EASY: Conservative, keeps large cash cushion (350 credits), rarely builds landmarks early.
 * - NORMAL: Balanced reserve (180 credits), buys most properties and upgrades completed districts steadily.
 * - HARD: Aggressive on completing districts and blocking opponents, maintains calculated reserve (110 credits).
 */
function getCashReserveThreshold(difficulty: AIDifficulty = 'NORMAL', roundNumber: number): number {
  switch (difficulty) {
    case 'EASY':
      return 340;
    case 'NORMAL':
      return 180;
    case 'HARD':
      return roundNumber <= 5 ? 80 : 120;
    default:
      return 180;
  }
}

/**
 * Evaluates whether the AI player should buy the property they just landed on.
 */
export function shouldAIBuyProperty(state: GameState): boolean {
  const player = state.players[state.currentPlayerIndex];
  if (!player) return false;

  const tile = BOARD_TILES[player.position];
  const price = tile?.purchasePrice ?? 0;
  if (!tile || player.money < price) return false;

  const difficulty = player.aiDifficulty ?? 'NORMAL';
  const reserve = getCashReserveThreshold(difficulty, state.roundNumber);
  const cashAfterBuy = player.money - price;

  // Check if buying completes a district for the AI
  if (tile.type === 'PROPERTY' && tile.district) {
    const districtIndices = DISTRICTS[tile.district].tileIndices;
    const ownedBySelf = districtIndices.filter(
      (idx) => state.properties[idx]?.ownerId === player.id
    ).length;
    const ownedByRival = districtIndices.filter(
      (idx) =>
        state.properties[idx]?.ownerId !== null &&
        state.properties[idx]?.ownerId !== player.id
    ).length;

    // Completing a district is high priority at all difficulties
    if (ownedBySelf === 2) {
      return player.money >= price;
    }

    // Hard AI buys to block an opponent who already owns 2 in the district
    if (difficulty === 'HARD' && ownedByRival === 2 && cashAfterBuy >= 40) {
      return true;
    }
  }

  // Easy AI is conservative and skips expensive properties if cash drops near reserve
  if (difficulty === 'EASY') {
    return cashAfterBuy >= reserve;
  }

  // Normal & Hard AI buy whenever cashAfterBuy >= reserve (or if they already have > 650 credits)
  return cashAfterBuy >= reserve || player.money >= price + 140;
}

/**
 * Finds the best property upgrade for an AI player during MANAGING_PROPERTIES / EXTRA_ROLL.
 */
export function findBestAIUpgrade(state: GameState): number | null {
  const player = state.players[state.currentPlayerIndex];
  if (!player || player.isBankrupt) return null;

  const difficulty = player.aiDifficulty ?? 'NORMAL';
  const reserve = getCashReserveThreshold(difficulty, state.roundNumber);

  const candidates: { tileIndex: number; score: number; cost: number }[] = [];

  BOARD_TILES.forEach((tile) => {
    if (tile.type === 'PROPERTY' && tile.district) {
      const check = canUpgradeProperty(state, player.id, tile.index);
      if (check.allowed && player.money - check.cost >= reserve) {
        const currentRent = tile.rentTiers?.[1] ?? tile.baseRent ?? 10;
        const nextRent = tile.rentTiers?.[2] ?? currentRent * 2;
        const roi = (nextRent - currentRent) / Math.max(1, check.cost);
        candidates.push({
          tileIndex: tile.index,
          score: difficulty === 'HARD' ? roi * 100 + tile.index : tile.index,
          cost: check.cost,
        });
      }
    }
  });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].tileIndex;
}

/**
 * Decides whether AI in Holding Yard should pay 50 credits / use card before rolling.
 */
export function shouldAILeaveHolding(state: GameState): {
  leave: boolean;
  useCard: boolean;
} {
  const player = state.players[state.currentPlayerIndex];
  if (!player || !player.inHolding) return { leave: false, useCard: false };

  if (player.freeExitCards > 0) {
    return { leave: true, useCard: true };
  }

  const difficulty = player.aiDifficulty ?? 'NORMAL';
  const unownedCount = Object.values(state.properties).filter((p) => p.ownerId === null).length;

  // Early/mid game when many properties are still unowned, paying 50 credits is smart
  if (player.money >= HOLDING_BAIL_COST + 200 && unownedCount >= 5) {
    return { leave: difficulty !== 'EASY', useCard: false };
  }

  return { leave: false, useCard: false };
}

/**
 * Executes a single atomic AI step for the current turnPhase.
 */
export function stepAITurn(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  if (!player || !player.isAI || player.isBankrupt) return state;

  switch (state.turnPhase) {
    case 'WAITING_FOR_ROLL': {
      if (player.inHolding) {
        const decision = shouldAILeaveHolding(state);
        if (decision.leave) {
          return leaveHoldingBeforeRollAction(state, decision.useCard);
        }
      }
      return rollDiceAction(state);
    }

    case 'EXTRA_ROLL': {
      const upgradeTile = findBestAIUpgrade(state);
      if (upgradeTile !== null) {
        return upgradePropertyAction(state, player.id, upgradeTile);
      }
      return endTurnAction(state);
    }

    case 'BUY_OR_PASS': {
      if (shouldAIBuyProperty(state)) {
        return buyPropertyAction(state);
      }
      return passPropertyAction(state);
    }

    case 'EVENT_DECISION': {
      return applyEventCardAction(state);
    }

    case 'DEBT_RESOLUTION': {
      // Find any development the AI can sell to cover the debt
      for (const tile of BOARD_TILES) {
        if (tile.type === 'PROPERTY') {
          const check = canSellDevelopment(state, player.id, tile.index);
          if (check.allowed) {
            return sellDevelopmentAction(state, player.id, tile.index);
          }
        }
      }
      return declareBankruptcyAction(state);
    }

    case 'MANAGING_PROPERTIES': {
      const upgradeTile = findBestAIUpgrade(state);
      if (upgradeTile !== null) {
        return upgradePropertyAction(state, player.id, upgradeTile);
      }
      return endTurnAction(state);
    }

    case 'ENDING_TURN': {
      return endTurnAction(state);
    }

    default:
      return state;
  }
}

export interface AIDeliberationPlan {
  powerRatio: number;
  targetZone: number;
  targetTileIndex: number;
  targetTileName: string;
  thought: string;
  isDiceControl: boolean;
}

/**
 * Plans the AI's dice roll: chooses target zone, calculates best landing tile,
 * and composes an authentic Let's Get Rich tactical deliberation thought.
 */
export function planAIRollDeliberation(state: GameState): AIDeliberationPlan {
  const player = state.players[state.currentPlayerIndex];
  if (!player) {
    return {
      powerRatio: 0.5,
      targetZone: 3,
      targetTileIndex: 0,
      targetTileName: 'Papan',
      thought: 'Mempersiapkan lemparan dadu...',
      isDiceControl: false,
    };
  }

  const currentPos = player.position;
  const card = CHARACTER_CARD_CATALOG.find((c) => c.id === player.cardId);
  const dcRate = card?.diceControl ?? 75;

  // Four dice gauge power zones:
  // Zone 1: sum 2-4 (powerRatio ~0.18)
  // Zone 2: sum 5-7 (powerRatio ~0.42)
  // Zone 3: sum 8-9 (powerRatio ~0.66)
  // Zone 4: sum 10-12 (powerRatio ~0.88)
  const zoneProfiles = [
    { zone: 1, ratio: 0.18, typicalSum: 3 },
    { zone: 2, ratio: 0.42, typicalSum: 6 },
    { zone: 3, ratio: 0.66, typicalSum: 8 },
    { zone: 4, ratio: 0.88, typicalSum: 11 },
  ];

  let bestZone = zoneProfiles[2];
  let bestScore = -9999;
  let targetTile = BOARD_TILES[(currentPos + bestZone.typicalSum) % 32];

  for (const zp of zoneProfiles) {
    const landingIdx = (currentPos + zp.typicalSum) % 32;
    const tile = BOARD_TILES[landingIdx];
    const prop = state.properties[landingIdx];
    let score = 0;

    if (tile.type === 'PROPERTY' && tile.district) {
      if (!prop?.ownerId) {
        score += 60;
        const distTiles = DISTRICTS[tile.district].tileIndices;
        const ownedBySelf = distTiles.filter(
          (t) => state.properties[t]?.ownerId === player.id
        ).length;
        if (ownedBySelf === 2) score += 200; // Immediate district completion priority!
      } else if (prop.ownerId === player.id) {
        score += 25; // Safe landing
      } else {
        score -= 75; // Avoid rival toll
      }
    } else if (tile.type === 'START') {
      score += 50; // Bonus salary
    } else if (tile.type === 'GO_TO_HOLDING') {
      score -= 150; // Danger
    } else if (tile.type === 'HOLDING') {
      score -= 20;
    } else if (tile.type === 'TRANSPORT') {
      if (!prop?.ownerId) score += 55;
      else if (prop.ownerId !== player.id) score -= 40;
    }

    if (score > bestScore) {
      bestScore = score;
      bestZone = zp;
      targetTile = tile;
    }
  }

  let thought = '';
  if (player.inHolding) {
    thought = `${player.name} mencoba peruntungan melempar Dadu Kembar untuk keluar dari Pulau Terisolasi!`;
  } else if (targetTile.type === 'PROPERTY' && !state.properties[targetTile.index]?.ownerId) {
    thought = `${player.name} membidik ${targetTile.name} (Zona ${bestZone.zone}) untuk memperluas monopoli!`;
  } else if (bestScore < 0) {
    thought = `${player.name} mengisi tenaga dadu ke Zona ${bestZone.zone} untuk menghindari petak sewa lawan!`;
  } else {
    thought = `${player.name} membidik Zona ${bestZone.zone} (Dadu target) dengan Akurasi Dadu Kontrol ${dcRate}%!`;
  }

  return {
    powerRatio: bestZone.ratio,
    targetZone: bestZone.zone,
    targetTileIndex: targetTile.index,
    targetTileName: targetTile.name,
    thought,
    isDiceControl: Math.random() * 100 < dcRate,
  };
}

