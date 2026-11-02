import React from 'react';
import {
  BOARD_TILES,
  DISTRICTS,
  SERVICE_MULTIPLIERS,
  TRANSPORT_RENT_TABLE,
  formatRupiah,
} from '../game/boardData';
import {
  calculateRent,
  canSellDevelopment,
  canUpgradeProperty,
  getEffectiveDevelopmentLevel,
  ownsFullDistrict,
} from '../game/engine';
import { GameState } from '../game/types';
import { DevelopmentBadgeSVG, TileCategorySVG } from './GameTokensSVG';

interface PropertyInspectorPanelProps {
  gameState: GameState;
  onUpgradeProperty: (tileIndex: number) => void;
  onSellDevelopment: (tileIndex: number) => void;
}

export const PropertyInspectorPanel: React.FC<PropertyInspectorPanelProps> = ({
  gameState,
  onUpgradeProperty,
  onSellDevelopment,
}) => {
  const tile = BOARD_TILES[gameState.selectedTileIndex] ?? BOARD_TILES[0];
  const propState = gameState.properties[tile.index];
  const owner = propState?.ownerId
    ? gameState.players.find((p) => p.id === propState.ownerId)
    : null;
  const district = tile.district ? DISTRICTS[tile.district] : null;
  const effectiveLevel = getEffectiveDevelopmentLevel(gameState.properties, tile.index);
  const currentRent = calculateRent(gameState, tile.index, gameState.lastDiceTotal);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn =
    currentPlayer &&
    !currentPlayer.isAI &&
    !currentPlayer.isBankrupt &&
    (gameState.turnPhase === 'MANAGING_PROPERTIES' ||
      gameState.turnPhase === 'EXTRA_ROLL' ||
      gameState.turnPhase === 'WAITING_FOR_ROLL' ||
      gameState.turnPhase === 'DEBT_RESOLUTION');

  const upgradeCheck = currentPlayer
    ? canUpgradeProperty(gameState, currentPlayer.id, tile.index)
    : { allowed: false, reason: '', cost: 0 };

  const sellCheck = currentPlayer
    ? canSellDevelopment(gameState, currentPlayer.id, tile.index)
    : { allowed: false, reason: '', refund: 0 };

  const levelLabels = [
    'Level 0 · Tanah Kosong',
    'Level 1 · Distrik Lengkap (2× Sewa)',
    'Level 2 · Paviliun Joglo',
    'Level 3 · Landmark Skyscraper',
  ];

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Top Card: Selected Tile / Property Inspector */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden shrink-0">
        {/* Header Bar */}
        <div
          className="px-3.5 py-2.5 flex items-center justify-between"
          style={{
            backgroundColor: district ? district.color : '#1E293B',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <TileCategorySVG type={tile.type} className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
              {district ? `${district.name} (${district.island})` : tile.type.replace(/_/g, ' ')}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-white/90 shrink-0">
            Petak #{tile.index}
          </span>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Title & Ownership */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#F4F1EA]">{tile.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{tile.description}</p>
            </div>
            {effectiveLevel > 0 && (
              <DevelopmentBadgeSVG level={effectiveLevel} className="w-6 h-6 shrink-0" />
            )}
          </div>

          {/* Ownership & Price Summary */}
          {(tile.type === 'PROPERTY' || tile.type === 'TRANSPORT' || tile.type === 'SERVICE') && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Pemilik</div>
                <div className="font-bold text-slate-100 mt-0.5 truncate flex items-center gap-1.5">
                  {owner ? (
                    <>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: owner.color }}
                      />
                      <span>{owner.name}</span>
                    </>
                  ) : (
                    <span className="text-teal-400">Tersedia · Belum Dimiliki</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  {owner ? 'Biaya Sewa Saat Ini' : 'Harga Beli'}
                </div>
                <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
                  {owner ? formatRupiah(currentRent) : formatRupiah(tile.purchasePrice ?? 0)}
                </div>
              </div>
            </div>
          )}

          {/* Property Rent Table & Development Controls */}
          {tile.type === 'PROPERTY' && tile.rentTiers && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Daftar Tingkat &amp; Biaya Sewa</span>
                <span>Biaya Bangun: {formatRupiah(tile.developmentCost ?? 0)}</span>
              </div>
              <div className="space-y-1 text-xs font-mono">
                {tile.rentTiers.map((rentVal, lvlIdx) => {
                  const isActiveTier = Boolean(owner && effectiveLevel === lvlIdx);
                  return (
                    <div
                      key={lvlIdx}
                      className={`flex items-center justify-between px-2.5 py-1 rounded border ${
                        isActiveTier
                          ? 'bg-amber-500/15 border-amber-400/60 text-amber-200 font-bold'
                          : 'bg-slate-900/60 border-slate-800/70 text-slate-300'
                      }`}
                    >
                      <span className="font-sans text-[11px]">{levelLabels[lvlIdx]}</span>
                      <span>{formatRupiah(rentVal)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Upgrade / Sell Action Buttons when Owned by Active Human Player */}
              {isHumanTurn && owner?.id === currentPlayer.id && (
                <div className="pt-2 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!upgradeCheck.allowed}
                      onClick={() => onUpgradeProperty(tile.index)}
                      className="flex-1 py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                    >
                      {effectiveLevel >= 3
                        ? 'Landmark Maksimal'
                        : `Bangun ${effectiveLevel === 2 ? 'Landmark' : 'Paviliun Joglo'} (${formatRupiah(
                            tile.developmentCost ?? 0
                          )})`}
                    </button>

                    {effectiveLevel >= 2 && (
                      <button
                        type="button"
                        disabled={!sellCheck.allowed}
                        onClick={() => onSellDevelopment(tile.index)}
                        className="py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 border border-rose-500/40 text-rose-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Jual (+{formatRupiah(sellCheck.refund)})
                      </button>
                    )}
                  </div>
                  {!upgradeCheck.allowed && upgradeCheck.reason && (
                    <p className="text-[11px] text-slate-400">{upgradeCheck.reason}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transport Rent Table */}
          {tile.type === 'TRANSPORT' && (
            <div className="space-y-1 text-xs">
              <div className="text-[11px] text-slate-400 mb-1">Skala Sewa Bandara Nusantara</div>
              {TRANSPORT_RENT_TABLE.map((amt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-900/60 border border-slate-800/70 text-slate-300 font-mono"
                >
                  <span className="font-sans text-[11px]">
                    Kuasai {idx + 1} Bandara
                  </span>
                  <span>{formatRupiah(amt)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Service Rent Info */}
          {tile.type === 'SERVICE' && (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900/60 border border-slate-800/70 text-slate-300">
                <span>Miliki 1 Utilitas Publik</span>
                <span className="font-mono font-semibold text-amber-300">
                  {SERVICE_MULTIPLIERS.SINGLE}× Angka Dadu
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900/60 border border-slate-800/70 text-slate-300">
                <span>Miliki Kedua Utilitas (PLN &amp; PDAM)</span>
                <span className="font-mono font-semibold text-amber-300">
                  {SERVICE_MULTIPLIERS.BOTH}× Angka Dadu
                </span>
              </div>
            </div>
          )}

          {/* District Mates Quick Jump */}
          {district && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status Monopoli Distrik</span>
              <span className="font-semibold text-slate-200">
                {owner && ownsFullDistrict(gameState.properties, owner.id, district.id)
                  ? '★ Distrik Lengkap (Sewa 2x lipat)'
                  : 'Belum Lengkap'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Card: Activity Log */}
      <div className="flex-1 bg-[#0F172A] border border-slate-800 rounded-xl p-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Log Aktivitas Nusantara
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            {gameState.logs.length} catatan
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {gameState.logs.slice(0, 35).map((entry) => (
            <div
              key={entry.id}
              className="text-xs leading-snug py-1.5 px-2 rounded bg-slate-900/70 border border-slate-800/60 text-slate-300 flex items-start gap-2"
            >
              <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">
                R{entry.turnNumber}
              </span>
              <span className="flex-1">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
