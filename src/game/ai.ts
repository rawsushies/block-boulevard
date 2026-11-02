import { BOARD_TILES, DISTRICTS, HOLDING_BAIL_COST } from './boardData';
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
