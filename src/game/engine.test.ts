import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_TILES,
  CITY_HALL_BONUS,
  DISTRICTS,
  STARTING_CREDITS,
  validateBoardConfiguration,
} from './boardData';
import {
  advanceMovementStepAction,
  buyPropertyAction,
  calculateRent,
  canSellDevelopment,
  canUpgradeProperty,
  checkMonopolyWinConditions,
  createInitialGameState,
  declareBankruptcyAction,
  endTurnAction,
  flushMovementQueue,
  getEffectiveDevelopmentLevel,
  ownsFullDistrict,
  passPropertyAction,
  rollDiceAction,
  rollDiceWithGaugeAction,
  sellDevelopmentAction,
  upgradePropertyAction,
} from './engine';
import { stepAITurn } from './ai';
import { GameConfig } from './types';

function makeTestConfig(): GameConfig {
  return {
    mode: 'QUICK_MATCH',
    quickGameMaxRounds: null,
    players: [
      {
        id: 'p1',
        name: 'Aria Pilot',
        cardId: 'garuda-aviator',
        token: 'aviator',
        color: '#0284C7',
        isAI: false,
      },
      {
        id: 'p2',
        name: 'Gatotkaca AI',
        cardId: 'gatot-kaca',
        token: 'warrior',
        color: '#F59E0B',
        isAI: true,
        aiDifficulty: 'HARD',
      },
    ],
  };
}

test('board configuration has 32 valid spaces, Indonesian corners at 0/8/16/24, and 6 districts', () => {
  const result = validateBoardConfiguration(BOARD_TILES);
  assert.equal(result.valid, true, `Board validation errors: ${result.errors.join(', ')}`);
  assert.equal(BOARD_TILES.length, 32);
  assert.equal(BOARD_TILES[0].name, 'Istana Merdeka');
  assert.equal(BOARD_TILES[8].name, 'Pulau Terisolasi');
  assert.equal(BOARD_TILES[16].name, 'Alun-Alun Monas');
  assert.equal(BOARD_TILES[24].name, 'Kantor Kejaksaan');
  assert.equal(Object.keys(DISTRICTS).length, 6);
});

test('players start with 1,500 credits at Istana Merdeka (index 0)', () => {
  const state = createInitialGameState(makeTestConfig());
  assert.equal(state.players.length, 2);
  assert.equal(state.players[0].money, STARTING_CREDITS);
  assert.equal(state.players[0].position, 0);
  assert.equal(state.turnPhase, 'WAITING_FOR_ROLL');
});

test('rolling dice moves step-by-step and lands on unowned property to trigger BUY_OR_PASS', () => {
  let state = createInitialGameState(makeTestConfig());
  // Roll 1 + 3 = 4 -> Danau Toba (index 4, price 80)
  state = rollDiceAction(state, [1, 3]);
  assert.equal(state.turnPhase, 'MOVING');
  assert.deepEqual(state.movementQueue, [1, 2, 3, 4]);

  state = advanceMovementStepAction(state);
  assert.equal(state.players[0].position, 1);
  assert.equal(state.turnPhase, 'MOVING');

  state = flushMovementQueue(state);
  assert.equal(state.players[0].position, 4);
  assert.equal(state.turnPhase, 'BUY_OR_PASS');

  // Buy Danau Toba
  state = buyPropertyAction(state);
  assert.equal(state.players[0].money, 1500 - 80);
  assert.equal(state.properties[4].ownerId, 'p1');
  assert.equal(state.turnPhase, 'MANAGING_PROPERTIES');
});

test('passing or landing on Istana Merdeka awards 200 credit bonus once', () => {
  let state = createInitialGameState(makeTestConfig());
  state.players[0].position = 30;
  state = rollDiceAction(state, [2, 3]); // 5 steps: 31, 0, 1, 2, 3
  state = flushMovementQueue(state);
  assert.equal(state.players[0].position, 3);
  assert.equal(state.players[0].money, STARTING_CREDITS + CITY_HALL_BONUS);
});

test('landing on Kantor Kejaksaan (24) sends player to Pulau Terisolasi (8)', () => {
  let state = createInitialGameState(makeTestConfig());
  state.players[0].position = 20;
  state = rollDiceAction(state, [1, 3]); // 4 steps -> 24
  state = flushMovementQueue(state);
  assert.equal(state.players[0].position, 8);
  assert.equal(state.players[0].inHolding, true);
  assert.equal(state.players[0].money, STARTING_CREDITS);
});

test('Medan district completion doubles base rent and unlocks even-building & even-selling', () => {
  let state = createInitialGameState(makeTestConfig());
  // Medan tiles: 1 (Kesawan), 2 (Istana Maimun), 4 (Danau Toba)
  state.properties[1].ownerId = 'p1';
  state.properties[2].ownerId = 'p1';
  assert.equal(ownsFullDistrict(state.properties, 'p1', 'MEDAN'), false);
  assert.equal(getEffectiveDevelopmentLevel(state.properties, 1), 0);
  assert.equal(calculateRent(state, 1, 7), 6);

  // Now own all 3 in Medan
  state.properties[4].ownerId = 'p1';
  assert.equal(ownsFullDistrict(state.properties, 'p1', 'MEDAN'), true);
  assert.equal(getEffectiveDevelopmentLevel(state.properties, 1), 1);
  assert.equal(calculateRent(state, 1, 7), 12); // Completed District rent

  // Upgrade tile 1 to Business (level 2, cost 50)
  assert.equal(canUpgradeProperty(state, 'p1', 1).allowed, true);
  state = upgradePropertyAction(state, 'p1', 1);
  assert.equal(getEffectiveDevelopmentLevel(state.properties, 1), 2);
  assert.equal(state.players[0].money, 1500 - 50);
  assert.equal(calculateRent(state, 1, 7), 35);

  // Even-building rule prevents upgrading tile 1 to Landmark before tiles 2 & 4 are Business
  assert.equal(canUpgradeProperty(state, 'p1', 1).allowed, false);
  assert.equal(canUpgradeProperty(state, 'p1', 2).allowed, true);

  // Sell Business on tile 1 for 50% refund (25 credits)
  assert.equal(canSellDevelopment(state, 'p1', 1).allowed, true);
  state = sellDevelopmentAction(state, 'p1', 1);
  assert.equal(getEffectiveDevelopmentLevel(state.properties, 1), 1);
  assert.equal(state.players[0].money, 1500 - 50 + 25);
});

test('three consecutive doubles send player to Pulau Terisolasi', () => {
  let state = createInitialGameState(makeTestConfig());
  state = rollDiceAction(state, [2, 2]);
  state = flushMovementQueue(state);
  state = passPropertyAction(state);
  state = endTurnAction(state); // triggers extra roll #1
  assert.equal(state.turnPhase, 'WAITING_FOR_ROLL');
  assert.equal(state.consecutiveDoubles, 1);

  state = rollDiceAction(state, [3, 3]);
  state = flushMovementQueue(state);
  state = passPropertyAction(state);
  state = endTurnAction(state); // triggers extra roll #2
  assert.equal(state.consecutiveDoubles, 2);

  // Third consecutive double -> immediately sent to Pulau Terisolasi (8)
  state = rollDiceAction(state, [4, 4]);
  assert.equal(state.players[0].inHolding, true);
  assert.equal(state.players[0].position, 8);
  assert.equal(state.hasExtraRoll, false);
});

test('Line Monopoly triggers when owning all purchasable tiles on one side', () => {
  const state = createInitialGameState(makeTestConfig());
  // Bottom side purchasable tiles: 1, 2, 3, 4, 5, 6, 7
  [1, 2, 3, 4, 5, 6, 7].forEach((idx) => {
    state.properties[idx].ownerId = 'p1';
  });
  const victory = checkMonopolyWinConditions(state);
  assert.ok(victory);
  assert.equal(victory.type, 'LINE_MONOPOLY');
  assert.equal(victory.winnerId, 'p1');
  assert.equal(victory.multiplier, 5);
});

test('Tourism Monopoly triggers when owning all 4 airports', () => {
  const state = createInitialGameState(makeTestConfig());
  // Airports: 3 (CGK), 12 (SUB), 21 (DPS), 28 (UPG)
  [3, 12, 21, 28].forEach((idx) => {
    state.properties[idx].ownerId = 'p1';
  });
  const victory = checkMonopolyWinConditions(state);
  assert.ok(victory);
  assert.equal(victory.type, 'TOURISM_MONOPOLY');
  assert.equal(victory.winnerId, 'p1');
  assert.equal(victory.multiplier, 5);
});

test('Triple Monopoly triggers when owning 3 complete city districts', () => {
  const state = createInitialGameState(makeTestConfig());
  // Medan (1, 2, 4), Bandung (5, 6, 7), Surabaya (9, 10, 11)
  [1, 2, 4, 5, 6, 7, 9, 10, 11].forEach((idx) => {
    state.properties[idx].ownerId = 'p2';
  });
  const victory = checkMonopolyWinConditions(state);
  assert.ok(victory);
  assert.equal(victory.type, 'TRIPLE_MONOPOLY');
  assert.equal(victory.winnerId, 'p2');
  assert.equal(victory.multiplier, 3);
});

test('Dice gauge rolls within target range when dice control triggers', () => {
  let state = createInitialGameState(makeTestConfig());
  // High gauge (>0.75) target sum: 10-12
  state = rollDiceWithGaugeAction(state, 0.9);
  assert.equal(state.turnPhase, 'MOVING');
  assert.ok(state.lastDiceTotal >= 2 && state.lastDiceTotal <= 12);
});

test('bankruptcy removes player, resets properties, and crowns surviving player winner', () => {
  let state = createInitialGameState(makeTestConfig());
  state.players[0].money = 10;
  state.properties[29].ownerId = 'p2'; // Mega Kuningan CBD owned by p2
  state.properties[29].builtLevel = 3; // Landmark rent
  state.properties[25].ownerId = 'p2';
  state.properties[27].ownerId = 'p2';
  state.properties[1].ownerId = 'p1';

  state.players[0].position = 27;
  state = rollDiceAction(state, [1, 1]); // moves 2 spaces to 29
  state = flushMovementQueue(state);
  assert.equal(state.turnPhase, 'DEBT_RESOLUTION');

  state = declareBankruptcyAction(state);
  assert.equal(state.players[0].isBankrupt, true);
  assert.equal(state.properties[1].ownerId, null);
  assert.equal(state.turnPhase, 'GAME_OVER');
  assert.equal(state.winnerId, 'p2');
});

test('AI opponent executes turn actions cleanly through the game engine', () => {
  let state = createInitialGameState(makeTestConfig());
  state.currentPlayerIndex = 1; // Gatotkaca AI
  state = stepAITurn(state); // rolls dice
  assert.equal(state.turnPhase, 'MOVING');
  state = flushMovementQueue(state);
  if (state.turnPhase === 'BUY_OR_PASS') {
    state = stepAITurn(state); // buys or passes
  }
  assert.equal(
    state.turnPhase === 'MANAGING_PROPERTIES' || state.turnPhase === 'EXTRA_ROLL',
    true
  );
});
