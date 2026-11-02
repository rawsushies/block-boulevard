import React from 'react';
import { BOARD_TILES, CHARACTER_CARD_CATALOG, DISTRICTS, formatRupiah } from '../game/boardData';
import { ownsFullDistrict } from '../game/engine';
import { DistrictId, GameState } from '../game/types';
import { PlayerTokenSVG, TierBadgeSVG } from './GameTokensSVG';

interface PlayerRosterPanelProps {
  gameState: GameState;
  onSelectTile: (tileIndex: number) => void;
}

export const PlayerRosterPanel: React.FC<PlayerRosterPanelProps> = ({
  gameState,
  onSelectTile,
}) => {
  const districtList = Object.values(DISTRICTS);

  return (
    <div className="flex flex-col h-full bg-[#0F172A] border border-slate-800 rounded-xl p-3 overflow-y-auto">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          PEMAIN AKTIF ({gameState.players.filter((p) => !p.isBankrupt).length}/
          {gameState.players.length})
        </h2>
        <span className="text-xs font-mono font-bold text-amber-400">
          Putaran {gameState.roundNumber}
          {gameState.quickGameMaxRounds ? `/${gameState.quickGameMaxRounds}` : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {gameState.players.map((player, idx) => {
          const isCurrent = idx === gameState.currentPlayerIndex && !player.isBankrupt;
          const card = CHARACTER_CARD_CATALOG.find((c) => c.id === player.cardId);
          const ownedTiles = BOARD_TILES.filter(
            (t) => gameState.properties[t.index]?.ownerId === player.id
          );
          const currentTile = BOARD_TILES[player.position];

          return (
            <div
              key={player.id}
              className={`rounded-lg p-2.5 border transition-colors ${
                player.isBankrupt
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-50'
                  : isCurrent
                  ? 'bg-slate-900 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              {/* Player Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <PlayerTokenSVG
                    cardId={player.cardId}
                    token={player.token}
                    color={player.color}
                    size={30}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-[#F4F1EA] truncate">
                        {player.name}
                      </span>
                      {card && <TierBadgeSVG tier={card.tier} />}
                      {player.isAI && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          · {player.aiDifficulty ?? 'AI'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {player.isBankrupt
                        ? 'Bangkrut · Tersingkir'
                        : player.inHolding
                        ? `Di Pulau Terisolasi (${player.holdingTurns}/3)`
                        : `Di ${currentTile?.shortName ?? 'Istana Merdeka'}`}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-bold text-amber-400">
                    {player.isBankrupt ? 'Rp 0' : formatRupiah(player.money)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {ownedTiles.length} {ownedTiles.length === 1 ? 'aset' : 'aset'}
                  </div>
                </div>
              </div>

              {/* District Ownership Matrix */}
              {!player.isBankrupt && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-6 gap-1">
                    {districtList.map((district) => {
                      const ownedInDistrict = district.tileIndices.filter(
                        (tIdx) => gameState.properties[tIdx]?.ownerId === player.id
                      );
                      const isComplete = ownsFullDistrict(
                        gameState.properties,
                        player.id,
                        district.id as DistrictId
                      );

                      return (
                        <button
                          key={district.id}
                          type="button"
                          onClick={() => onSelectTile(district.tileIndices[0])}
                          title={`${district.name}: ${ownedInDistrict.length}/3 dimiliki`}
                          className={`flex flex-col items-center p-1 rounded border transition-colors cursor-pointer ${
                            isComplete
                              ? 'border-amber-400/80 bg-slate-800'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className="w-full h-1.5 rounded-sm mb-1"
                            style={{ backgroundColor: district.color }}
                          />
                          <div className="flex items-center gap-0.5">
                            {district.tileIndices.map((tIdx) => {
                              const hasIt = gameState.properties[tIdx]?.ownerId === player.id;
                              return (
                                <span
                                  key={tIdx}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor: hasIt ? district.color : '#334155',
                                  }}
                                />
                              );
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
