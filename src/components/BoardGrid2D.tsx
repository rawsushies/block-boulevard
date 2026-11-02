import React from 'react';
import {
  BOARD_TILES,
  DISTRICTS,
  HOLDING_BAIL_COST,
  formatRupiah,
  getTileGridPosition,
} from '../game/boardData';
import {
  calculateRent,
  canSellDevelopment,
  canUpgradeProperty,
  getEffectiveDevelopmentLevel,
  ownsFullDistrict,
} from '../game/engine';
import { BoardTile, GameState } from '../game/types';
import { CityTabletop3D } from './CityTabletop3D';
import { DicePowerGauge } from './DicePowerGauge';
import {
  DevelopmentBadgeSVG,
  DiceFaceSVG,
  PlayerTokenSVG,
  TileCategorySVG,
} from './GameTokensSVG';

interface BoardGrid2DProps {
  gameState: GameState;
  isRollingAnim: boolean;
  show3DView: boolean;
  onToggle3DView: () => void;
  onSelectTile: (index: number) => void;
  onRollDice: (powerRatio?: number) => void;
  onBuyProperty: () => void;
  onPassProperty: () => void;
  onApplyEventCard: () => void;
  onEndTurn: () => void;
  onLeaveHolding: (useCard: boolean) => void;
  onUpgradeProperty: (tileIndex: number) => void;
  onSellDevelopment: (tileIndex: number) => void;
  onDeclareBankruptcy: () => void;
}

export const BoardGrid2D: React.FC<BoardGrid2DProps> = ({
  gameState,
  isRollingAnim,
  show3DView,
  onToggle3DView,
  onSelectTile,
  onRollDice,
  onBuyProperty,
  onPassProperty,
  onApplyEventCard,
  onEndTurn,
  onLeaveHolding,
  onUpgradeProperty,
  onSellDevelopment,
  onDeclareBankruptcy,
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn = currentPlayer && !currentPlayer.isAI && !currentPlayer.isBankrupt;
  const currentTile = BOARD_TILES[ currentPlayer?.position ?? 0 ];

  // Find upgradeable properties for the current player to offer quick build buttons
  const upgradeableTiles = BOARD_TILES.filter(
    (t) =>
      t.type === 'PROPERTY' &&
      canUpgradeProperty(gameState, currentPlayer?.id ?? '', t.index).allowed
  );

  // Find sellable developments in case of DEBT_RESOLUTION
  const sellableTiles = BOARD_TILES.filter(
    (t) =>
      t.type === 'PROPERTY' &&
      canSellDevelopment(gameState, currentPlayer?.id ?? '', t.index).allowed
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center p-1 sm:p-2">
      {/* Square 9x9 Board Container */}
      <div
        data-testid="board-grid-9x9"
        className="relative w-full h-full max-w-[min(100%,calc(100vh-16px))] max-h-[min(100%,calc(100vw-16px))] aspect-square grid grid-cols-9 grid-rows-9 gap-[2px] sm:gap-1 bg-[#1E293B] p-1.5 sm:p-2 rounded-xl border-2 border-[#334155] shadow-2xl"
      >
        {/* 32 Perimeter Spaces */}
        {BOARD_TILES.map((tile) => {
          const { row, col, side } = getTileGridPosition(tile.index);
          const propState = gameState.properties[tile.index];
          const owner = propState?.ownerId
            ? gameState.players.find((p) => p.id === propState.ownerId)
            : null;
          const district = tile.district ? DISTRICTS[tile.district] : null;
          const devLevel = getEffectiveDevelopmentLevel(gameState.properties, tile.index);
          const playersHere = gameState.players.filter(
            (p) => !p.isBankrupt && p.position === tile.index
          );
          const isSelected = gameState.selectedTileIndex === tile.index;
          const isCurrentLanding =
            currentPlayer && !currentPlayer.isBankrupt && currentPlayer.position === tile.index;

          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => onSelectTile(tile.index)}
              style={{ gridRow: row, gridColumn: col }}
              aria-label={`Tile ${tile.index}: ${tile.name}${
                tile.purchasePrice ? `, Price ${tile.purchasePrice} credits` : ''
              }${owner ? `, Owned by ${owner.name}` : ''}`}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-md text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-amber-400 ${
                side === 'corner'
                  ? 'bg-[#EAE4D3] text-[#0F172A] border border-amber-500/50'
                  : 'bg-[#F4F1EA] text-[#0F172A] border border-slate-300/80'
              } ${
                isSelected
                  ? 'ring-2 ring-amber-400 z-10 scale-[1.03]'
                  : isCurrentLanding
                  ? 'ring-2 ring-teal-400 z-10'
                  : 'hover:brightness-95'
              }`}
            >
              {/* District Color Bar or Special Header */}
              {district ? (
                <div
                  className="w-full h-2 sm:h-2.5 shrink-0 flex items-center justify-between px-1"
                  style={{ backgroundColor: district.color }}
                >
                  {devLevel > 0 && (
                    <DevelopmentBadgeSVG level={devLevel} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  )}
                </div>
              ) : (
                <div className="w-full h-1.5 sm:h-2 shrink-0 bg-slate-800/15" />
              )}

              {/* Tile Name & Category Icon */}
              <div className="flex-1 flex flex-col items-center justify-center px-0.5 py-0.5 text-center leading-none sm:leading-tight overflow-hidden">
                {!district && (
                  <TileCategorySVG
                    type={tile.type}
                    className="w-3 h-3 sm:w-4 sm:h-4 mb-0.5 shrink-0"
                  />
                )}
                <span className="text-[7px] sm:text-[10px] md:text-[11px] font-semibold tracking-tight text-slate-900 line-clamp-2 w-full truncate sm:whitespace-normal">
                  {tile.shortName}
                </span>
              </div>

              {/* Bottom Strip: Price / Fee / Owner Indicator */}
              <div className="w-full px-0.5 sm:px-1 py-0.5 bg-slate-900/5 flex items-center justify-between text-[7.5px] sm:text-[9px] font-mono-num font-semibold text-slate-700">
                {owner ? (
                  <span
                    className="w-full truncate text-center rounded-[2px] px-0.5 text-[7.5px] sm:text-[8px] font-bold text-slate-950"
                    style={{ backgroundColor: owner.color }}
                  >
                    {devLevel === 3
                      ? '★ LMK'
                      : devLevel === 2
                      ? '▲ BIZ'
                      : devLevel === 1
                      ? '◆ SET'
                      : owner.name.slice(0, 5)}
                  </span>
                ) : tile.purchasePrice ? (
                  <span className="mx-auto">{tile.purchasePrice}c</span>
                ) : tile.feeAmount ? (
                  <span className="mx-auto text-rose-700">-{tile.feeAmount}c</span>
                ) : (
                  <span className="mx-auto text-slate-500">#{tile.index}</span>
                )}
              </div>

              {/* Player Tokens Standing on Tile (Anchored cleanly so tile name stays readable) */}
              {playersHere.length > 0 && (
                <div className="absolute top-1 right-0.5 pointer-events-none flex items-center justify-end flex-wrap gap-0.5 max-w-full">
                  {playersHere.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-full shadow-md"
                      title={p.name}
                    >
                      <PlayerTokenSVG
                        cardId={p.cardId}
                        token={p.token}
                        color={p.color}
                        size={playersHere.length > 2 ? 13 : 16}
                      />
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}

        {/* Central 7x7 Area (Rows 2..8, Cols 2..8) */}
        <div
          style={{ gridRow: '2 / 9', gridColumn: '2 / 9' }}
          className="relative rounded-lg bg-[#0A111F] border border-slate-700/80 overflow-hidden flex flex-col justify-between"
        >
          {/* Ambient 3D City Tabletop Scene in Center */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              show3DView ? 'opacity-100 z-10' : 'opacity-40 pointer-events-none'
            }`}
          >
            <CityTabletop3D
              gameState={gameState}
              mode="board"
              onSelectTile={onSelectTile}
            />
          </div>

          {/* Top Bar inside 7x7 Center: Active Player & 3D Camera Toggle */}
          <div className="relative z-20 flex items-center justify-between gap-2 px-3 py-2 bg-[#0F172A]/95 border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              {currentPlayer && (
                <PlayerTokenSVG
                  cardId={currentPlayer.cardId}
                  token={currentPlayer.token}
                  color={currentPlayer.color}
                  size={26}
                />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-[#F4F1EA] truncate">
                    {currentPlayer?.name}
                  </span>
                  <span className="text-[11px] text-slate-400">·</span>
                  <span className="text-xs font-mono font-semibold text-amber-400">
                    {currentPlayer ? formatRupiah(currentPlayer.money) : 'Rp 0'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                  Round {gameState.roundNumber}
                  {gameState.quickGameMaxRounds ? ` / ${gameState.quickGameMaxRounds}` : ''} · At{' '}
                  {currentTile?.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggle3DView}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {show3DView ? '2D Console' : '3D Orbit View'}
            </button>
          </div>

          {/* District Completion Banner Notification (if triggered this turn) */}
          {gameState.districtNotification && !show3DView && (
            <div className="relative z-20 mx-3 mt-2 px-3 py-1.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs flex items-center justify-between">
              <span>
                <strong>{gameState.districtNotification.playerName}</strong> completed{' '}
                <strong>{gameState.districtNotification.districtName}</strong>! Rents doubled &amp;
                development unlocked.
              </span>
            </div>
          )}

          {/* Main Turn Console in Center */}
          {!show3DView ? (
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-2 sm:p-4 text-center overflow-y-auto">
              {/* Dice Readout */}
              <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                <DiceFaceSVG value={gameState.dice[0]} rolling={isRollingAnim} size={38} />
                <DiceFaceSVG value={gameState.dice[1]} rolling={isRollingAnim} size={38} />
                <div className="text-left pl-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    {gameState.lastDiceTotal > 0 ? 'Last Roll' : 'Dice Ready'}
                  </div>
                  <div className="text-sm sm:text-lg font-mono-num font-bold text-[#F4F1EA]">
                    {gameState.lastDiceTotal > 0 ? (
                      <>
                        {gameState.dice[0]} + {gameState.dice[1]} = {gameState.lastDiceTotal}
                        {gameState.dice[0] === gameState.dice[1] && (
                          <span className="ml-1.5 text-xs font-semibold text-amber-400">
                            DOUBLES
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-300 font-sans">
                        Roll 2d6 to begin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Phase-Specific Controls */}
              {!isHumanTurn ? (
                <div className="max-w-xs w-full bg-[#0F172A]/95 border border-slate-800 rounded-lg p-3 shadow-lg">
                  <p className="text-xs sm:text-sm font-semibold text-amber-300">
                    {currentPlayer?.name} is making a move...
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {gameState.logs[0]?.message}
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. WAITING_FOR_ROLL */}
                  {gameState.turnPhase === 'WAITING_FOR_ROLL' && (
                    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                      {currentPlayer.inHolding && (
                        <div className="w-full bg-slate-900/95 border border-amber-500/40 rounded-lg p-2.5 mb-1 text-xs">
                          <p className="font-semibold text-amber-300">
                            In Holding Yard (Attempt {currentPlayer.holdingTurns + 1}/3)
                          </p>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Roll doubles to leave, or clear inspection before rolling:
                          </p>
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <button
                              type="button"
                              disabled={currentPlayer.money < HOLDING_BAIL_COST}
                              onClick={() => onLeaveHolding(false)}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Bayar {formatRupiah(HOLDING_BAIL_COST)}
                            </button>
                            {currentPlayer.freeExitCards > 0 && (
                              <button
                                type="button"
                                onClick={() => onLeaveHolding(true)}
                                className="px-2.5 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Gunakan Kartu Bebas ({currentPlayer.freeExitCards})
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <DicePowerGauge
                        player={currentPlayer}
                        disabled={!isHumanTurn}
                        onRoll={onRollDice}
                      />
                    </div>
                  )}

                  {/* 2. MOVING */}
                  {gameState.turnPhase === 'MOVING' && (
                    <div className="text-xs sm:text-sm font-semibold text-teal-300">
                      Moving along the boulevard ({gameState.movementQueue.length} steps left)...
                    </div>
                  )}

                  {/* 3. BUY_OR_PASS */}
                  {gameState.turnPhase === 'BUY_OR_PASS' && currentTile && (
                    <BuyOrPassCard
                      tile={currentTile}
                      playerMoney={currentPlayer.money}
                      onBuy={onBuyProperty}
                      onPass={onPassProperty}
                    />
                  )}

                  {/* 4. EVENT_DECISION */}
                  {gameState.turnPhase === 'EVENT_DECISION' && gameState.activeEventCard && (
                    <div className="w-full max-w-sm bg-[#0F172A]/95 border-2 border-purple-500/60 rounded-xl p-3 sm:p-4 text-left shadow-xl">
                      <div className="flex items-center justify-between text-[10px] font-mono-num uppercase tracking-wider text-purple-300 mb-1">
                        <span>
                          {gameState.activeEventCard.deck === 'CITY_PULSE'
                            ? 'City Pulse Deck'
                            : 'Civic Notice Deck'}
                        </span>
                        <span>Event Card</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#F4F1EA]">
                        {gameState.activeEventCard.title}
                      </h3>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        {gameState.activeEventCard.description}
                      </p>
                      <p className="text-[11px] italic text-slate-400 mt-1">
                        “{gameState.activeEventCard.flavor}”
                      </p>
                      <button
                        type="button"
                        onClick={onApplyEventCard}
                        className="mt-3 w-full py-2 px-4 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        RESOLVE EVENT
                      </button>
                    </div>
                  )}

                  {/* 5. DEBT_RESOLUTION */}
                  {gameState.turnPhase === 'DEBT_RESOLUTION' && gameState.pendingDebt && (
                    <div className="w-full max-w-sm bg-rose-950/90 border-2 border-rose-500 rounded-xl p-3 text-left shadow-xl">
                      <h3 className="text-sm font-bold text-rose-200">
                        Insufficient Funds: {gameState.pendingDebt.amount}c Required
                      </h3>
                      <p className="text-xs text-rose-100/90 mt-1">
                        You have <strong>{currentPlayer.money}c</strong> and owe{' '}
                        <strong>{gameState.pendingDebt.amount}c</strong> for{' '}
                        {gameState.pendingDebt.reason}.
                      </p>
                      {sellableTiles.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-[11px] font-semibold text-amber-300">
                            Sell developments (50% refund) to raise cash:
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                            {sellableTiles.map((t) => {
                              const check = canSellDevelopment(gameState, currentPlayer.id, t.index);
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => onSellDevelopment(t.index)}
                                  className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-[11px] cursor-pointer"
                                >
                                  Sell on {t.shortName} (+{check.refund}c)
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-rose-300 mt-1.5">
                          You have no built developments left to liquidate.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={onDeclareBankruptcy}
                        className="mt-2.5 w-full py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                      >
                        DECLARE BANKRUPTCY
                      </button>
                    </div>
                  )}

                  {/* 6. MANAGING_PROPERTIES or EXTRA_ROLL */}
                  {(gameState.turnPhase === 'MANAGING_PROPERTIES' ||
                    gameState.turnPhase === 'EXTRA_ROLL') && (
                    <div className="w-full max-w-xs flex flex-col items-center gap-2">
                      {upgradeableTiles.length > 0 && (
                        <div className="w-full bg-[#0F172A]/95 border border-teal-500/40 rounded-lg p-2 text-left">
                          <div className="text-[10px] uppercase tracking-wider text-teal-300 font-semibold mb-1">
                            Develop Completed Districts
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {upgradeableTiles.map((t) => {
                              const check = canUpgradeProperty(gameState, currentPlayer.id, t.index);
                              const nextLvl =
                                getEffectiveDevelopmentLevel(gameState.properties, t.index) === 1
                                  ? 'Business'
                                  : 'Landmark';
                              return (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => onUpgradeProperty(t.index)}
                                  className="px-2 py-1 rounded bg-teal-500/20 hover:bg-teal-500/35 border border-teal-400/50 text-teal-200 text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  + {t.shortName} ({nextLvl} · {check.cost}c)
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={onEndTurn}
                        className={`w-full py-2.5 px-5 rounded-lg font-bold text-sm sm:text-base shadow-lg transition-all cursor-pointer ${
                          gameState.hasExtraRoll
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
                        }`}
                      >
                        {gameState.hasExtraRoll ? 'EXTRA ROLL (DOUBLES!)' : 'END TURN'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="relative z-20 mt-auto p-2 bg-[#0F172A]/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span>Drag to orbit 3D city · Scroll to zoom · Click any tile to inspect</span>
              <button
                type="button"
                onClick={onToggle3DView}
                className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Return to Turn Controls
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BuyOrPassCard: React.FC<{
  tile: BoardTile;
  playerMoney: number;
  onBuy: () => void;
  onPass: () => void;
}> = ({ tile, playerMoney, onBuy, onPass }) => {
  const district = tile.district ? DISTRICTS[tile.district] : null;
  const price = tile.purchasePrice ?? 0;
  const canAfford = playerMoney >= price;

  return (
    <div className="w-full max-w-sm bg-[#0F172A]/95 border border-slate-700 rounded-xl overflow-hidden shadow-xl text-left">
      <div
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: district ? district.color : '#0284C7' }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-white">
          {district ? district.name : tile.type}
        </span>
        <span className="text-xs font-mono-num font-bold text-white">Price: {price}c</span>
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm sm:text-base font-bold text-[#F4F1EA]">{tile.name}</h3>
          <span className="text-xs font-mono-num text-teal-300">
            Base Rent: {tile.baseRent ?? '4× Dice'}
            {tile.baseRent ? 'c' : ''}
          </span>
        </div>

        {tile.rentTiers && tile.type === 'PROPERTY' && (
          <div className="grid grid-cols-4 gap-1 mt-2 text-center bg-slate-900/90 p-1.5 rounded border border-slate-800 text-[10px] font-mono-num">
            <div>
              <div className="text-slate-400">Lot</div>
              <div className="font-bold text-slate-200">{tile.rentTiers[0]}c</div>
            </div>
            <div>
              <div className="text-amber-300">District</div>
              <div className="font-bold text-amber-300">{tile.rentTiers[1]}c</div>
            </div>
            <div>
              <div className="text-teal-300">Business</div>
              <div className="font-bold text-teal-300">{tile.rentTiers[2]}c</div>
            </div>
            <div>
              <div className="text-yellow-300">Landmark</div>
              <div className="font-bold text-yellow-300">{tile.rentTiers[3]}c</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            disabled={!canAfford}
            onClick={onBuy}
            className="flex-1 py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            {canAfford ? `BUY (${price}c)` : `NEED ${price}c`}
          </button>
          <button
            type="button"
            onClick={onPass}
            className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
          >
            PASS
          </button>
        </div>
      </div>
    </div>
  );
};
