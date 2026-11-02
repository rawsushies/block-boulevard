import React, { useState } from 'react';
import {
  CHARACTER_CARD_CATALOG,
  formatRupiah,
} from '../game/boardData';
import {
  AIDifficulty,
  GameConfig,
  GameMode,
  GameState,
  PlayerConfig,
} from '../game/types';
import { PlayerTokenSVG, TierBadgeSVG } from './GameTokensSVG';

interface SetupModalProps {
  initialMode: GameMode;
  onStartMatch: (config: GameConfig) => void;
  onCancel: () => void;
}

const DEFAULT_AI_NAMES = ['Gatotkaca AI', 'Dewi Sri AI', 'Sultan Celebes AI'];

export const SetupModal: React.FC<SetupModalProps> = ({
  initialMode,
  onStartMatch,
  onCancel,
}) => {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [playerCount, setPlayerCount] = useState<number>(initialMode === 'QUICK_MATCH' ? 4 : 2);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('NORMAL');
  const [quickGameRounds, setQuickGameRounds] = useState<number | null>(null);

  const [humanNames, setHumanNames] = useState<string[]>([
    'Kapten Nusantara',
    'Pemain 2',
    'Pemain 3',
    'Pemain 4',
  ]);
  const [selectedCards, setSelectedCards] = useState<string[]>([
    'garuda-aviator',
    'gatot-kaca',
    'dewi-sri',
    'sultan-hasanuddin',
  ]);

  const handleCardChange = (playerIdx: number, cardId: string) => {
    setSelectedCards((prev) => {
      const next = [...prev];
      next[playerIdx] = cardId;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const players: PlayerConfig[] = [];
    for (let i = 0; i < playerCount; i++) {
      const isAI = mode === 'QUICK_MATCH' && i > 0;
      const cardId = selectedCards[i] ?? CHARACTER_CARD_CATALOG[i % CHARACTER_CARD_CATALOG.length].id;
      const cardMeta =
        CHARACTER_CARD_CATALOG.find((c) => c.id === cardId) ??
        CHARACTER_CARD_CATALOG[i % CHARACTER_CARD_CATALOG.length];
      const rawName = isAI ? DEFAULT_AI_NAMES[i - 1] ?? `AI ${i}` : humanNames[i]?.trim();

      players.push({
        id: `player-${i + 1}`,
        name: rawName || (isAI ? `Developer AI ${i}` : `Pemain ${i + 1}`),
        cardId: cardMeta.id,
        token: cardMeta.avatarId,
        color: cardMeta.color,
        isAI,
        aiDifficulty: isAI ? aiDifficulty : undefined,
      });
    }

    onStartMatch({
      mode,
      players,
      quickGameMaxRounds: quickGameRounds,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-[#0F172A] border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                LINE LET'S GET RICH INDONESIA
              </span>
            </div>
            <h2 id="setup-modal-title" className="text-xl font-bold text-[#F4F1EA]">
              Konfigurasi Ruang Pertandingan
            </h2>
            <p className="text-xs text-slate-400">
              Pilih Karakter Card Class S+/S/A+, avatar, dan mode sebelum masuk ke papan permainan.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Mode Permainan
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('QUICK_MATCH');
                setPlayerCount(4);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                mode === 'QUICK_MATCH'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-[#F4F1EA]">Tanding Solo vs AI</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Bermain bersama 3 bot AI berkarakter dengan kartu pilihan
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('LOCAL_FRIENDS');
                setPlayerCount(2);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                mode === 'LOCAL_FRIENDS'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-[#F4F1EA]">Multiplayer Teman (Pass &amp; Play)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Bermain bergantian di layar yang sama bersama 2–4 teman
              </div>
            </button>
          </div>
        </div>

        {/* Player Count & AI Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Jumlah Pemain ({playerCount})
            </label>
            <div className="flex gap-2">
              {[2, 3, 4].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setPlayerCount(cnt)}
                  className={`flex-1 py-2 rounded-lg font-mono font-bold text-xs border cursor-pointer ${
                    playerCount === cnt
                      ? 'bg-slate-800 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {cnt} Pemain
                </button>
              ))}
            </div>
          </div>

          {mode === 'QUICK_MATCH' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tingkat Kesulitan AI
              </label>
              <div className="flex gap-2">
                {(['EASY', 'NORMAL', 'HARD'] as AIDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setAiDifficulty(diff)}
                    className={`flex-1 py-2 rounded-lg font-mono font-bold text-xs border cursor-pointer ${
                      aiDifficulty === diff
                        ? 'bg-slate-800 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {diff === 'EASY' ? 'Santai' : diff === 'NORMAL' ? 'Standar' : 'Pro S+'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Character Card Selection Deck */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Roster &amp; Pilihan Kartu Karakter
          </label>
          {Array.from({ length: playerCount }).map((_, idx) => {
            const isAI = mode === 'QUICK_MATCH' && idx > 0;
            const currentCardId = selectedCards[idx] ?? CHARACTER_CARD_CATALOG[idx % CHARACTER_CARD_CATALOG.length].id;
            const cardMeta =
              CHARACTER_CARD_CATALOG.find((c) => c.id === currentCardId) ??
              CHARACTER_CARD_CATALOG[idx % CHARACTER_CARD_CATALOG.length];

            return (
              <div
                key={idx}
                className="flex flex-col gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PlayerTokenSVG
                      cardId={cardMeta.id}
                      token={cardMeta.avatarId}
                      color={cardMeta.color}
                      size={36}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#F4F1EA]">
                          {isAI ? DEFAULT_AI_NAMES[idx - 1] ?? `AI ${idx}` : humanNames[idx]}
                        </span>
                        <TierBadgeSVG tier={cardMeta.tier} />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {cardMeta.name} · {cardMeta.title}
                      </div>
                    </div>
                  </div>

                  {/* Character Stats Badge */}
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                      DC {cardMeta.diceControl}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Diskon Sewa {cardMeta.tollDiscount}%
                    </span>
                  </div>
                </div>

                {/* Card selector pills */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
                  {CHARACTER_CARD_CATALOG.map((card) => {
                    const isPicked = currentCardId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleCardChange(idx, card.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left shrink-0 transition-all cursor-pointer ${
                          isPicked
                            ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400/40 text-amber-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <TierBadgeSVG tier={card.tier} />
                        <span className="text-[11px] font-semibold">{card.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            MASUK PAPAN PERMAINAN
          </button>
        </div>
      </form>
    </div>
  );
};

export const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="how-to-play-title"
  >
    <div className="w-full max-w-2xl bg-[#0F172A] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">
            PANDUAN LENGKAP
          </span>
          <h2 id="how-to-play-title" className="text-xl font-bold text-[#F4F1EA]">
            Cara Bermain Let's Get Rich Nusantara
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
        >
          Tutup
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 leading-relaxed">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="font-bold text-amber-400 text-sm mb-1">1. Istana Merdeka &amp; Keliling Peta</h3>
          <p>
            Semua pemain mengawali permainan dari <strong>Istana Merdeka</strong> dengan modal{' '}
            <strong>Rp 1.500.000</strong>. Setiap melewati atau mendarat di Istana Merdeka, Anda menerima tunjangan{' '}
            <strong>Rp 200.000</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="font-bold text-sky-400 text-sm mb-1">2. Dice Power Gauge &amp; Dice Control</h3>
          <p>
            Tekan dan tahan tombol <strong>LEMPAR DADU</strong> untuk mengisi gauge power (LOW 2-4, MID-LOW 5-7,
            MID-HIGH 8-9, HIGH 10-12). Semakin tinggi stat <strong>Dice Control (DC)</strong> pada Kartu Karakter Anda,
            semakin akurat dadu mendarat pada target!
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="font-bold text-emerald-400 text-sm mb-1">
            3. Membangun Joglo &amp; Landmark
          </h3>
          <p>
            Kuasai seluruh 3 petak dalam 1 distrik kota (Medan, Bandung, Surabaya, Makassar, Denpasar, Jakarta) untuk
            menggandakan sewa dan membuka izin pembangunan <strong>Paviliun Joglo</strong> dan{' '}
            <strong>Landmark Skyscraper</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <h3 className="font-bold text-rose-400 text-sm mb-1">4. Pulau Terisolasi &amp; Dadu Ganda</h3>
          <p>
            Mendapat dadu ganda memberi giliran ekstra! Namun mendapatkan <strong>3 dadu ganda berturut-turut</strong>{' '}
            atau mendarat di Kantor Kejaksaan akan mengirim Anda ke <strong>Pulau Terisolasi</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-teal-500/10 border border-amber-500/40 sm:col-span-2">
          <h3 className="font-bold text-amber-300 text-sm mb-1">
            👑 3 Kemenangan Instan Signature Let's Get Rich!
          </h3>
          <ul className="space-y-1 text-slate-300">
            <li>
              ✨ <strong>Line Monopoly (5x Skor):</strong> Kuasai semua properti dalam satu sisi jalur papan nusantara!
            </li>
            <li>
              ✈️ <strong>Tourism Monopoly (5x Skor):</strong> Kuasai 4 bandara utama (CGK, SUB, DPS, UPG)!
            </li>
            <li>
              🏆 <strong>Triple Monopoly (3x Skor):</strong> Kuasai 3 distrik kota metropolitan secara bersamaan!
            </li>
          </ul>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer"
        >
          Mengerti, Siap Main!
        </button>
      </div>
    </div>
  </div>
);

export const PauseModal: React.FC<{
  muted: boolean;
  onToggleMute: () => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}> = ({ muted, onToggleMute, onResume, onRestart, onMainMenu }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pause-modal-title"
  >
    <div className="w-full max-w-sm bg-[#0F172A] border border-slate-700 rounded-2xl p-6 text-center shadow-2xl space-y-4">
      <h2 id="pause-modal-title" className="text-xl font-bold text-[#F4F1EA]">
        Pertandingan Dijeda
      </h2>

      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onResume}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer shadow-lg"
        >
          Lanjutkan
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{muted ? '🔇 Suara: Mati' : '🔊 Suara: Aktif'}</span>
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
        >
          Mulai Ulang Pertandingan
        </button>

        <button
          type="button"
          onClick={onMainMenu}
          className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs cursor-pointer"
        >
          Kembali ke Menu Utama
        </button>
      </div>
    </div>
  </div>
);

export const MatchOverModal: React.FC<{
  gameState: GameState;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}> = ({ gameState, onPlayAgain, onMainMenu }) => {
  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const monopoly = gameState.monopolyVictory;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#0F172A] border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Monopoly Splash Banner */}
        {monopoly ? (
          <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-yellow-400 text-center space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black font-mono tracking-widest shadow">
              {monopoly.multiplier}X SKOR MULTIPLIER
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide font-mono uppercase drop-shadow">
              👑 {monopoly.title}
            </h2>
            <p className="text-xs sm:text-sm text-yellow-100 font-medium">
              {monopoly.description}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-1.5">
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Pertandingan Selesai · Hasil Akhir
            </div>
            <h2 id="victory-modal-title" className="text-2xl sm:text-3xl font-bold text-[#F4F1EA]">
              {winner ? `🏆 ${winner.name} Menang!` : 'Pertandingan Selesai'}
            </h2>
            <p className="text-xs text-slate-400">
              Selesai dalam {gameState.roundNumber} putaran · Evaluasi total kekayaan properti
            </p>
          </div>
        )}

        {/* Standings Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Peringkat</th>
                <th className="py-2.5 px-3">Pemain</th>
                <th className="py-2.5 px-3 text-right">Uang Tunai</th>
                <th className="py-2.5 px-3 text-right">Nilai Tanah</th>
                <th className="py-2.5 px-3 text-right">Bangunan</th>
                <th className="py-2.5 px-3 text-right">Total Aset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {gameState.rankings.map((row) => (
                <tr
                  key={row.playerId}
                  className={row.rank === 1 ? 'bg-amber-500/10 text-amber-100 font-bold' : 'text-slate-300'}
                >
                  <td className="py-2.5 px-3">#{row.rank}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <div className="flex items-center gap-2">
                      <PlayerTokenSVG
                        cardId={row.cardId}
                        token={row.token}
                        color={row.color}
                        size={24}
                      />
                      <div>
                        <div className="font-bold text-[#F4F1EA]">{row.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {row.isBankrupt
                            ? 'Bangkrut'
                            : `${row.propertiesOwned} aset · ${row.completedDistricts.length} distrik`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(row.cash)}</td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(row.propertyValue)}</td>
                  <td className="py-2.5 px-3 text-right">{formatRupiah(row.developmentValue)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                    {formatRupiah(row.netWorth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
          >
            KEMBALI KE LOBI MENU
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/30 cursor-pointer"
          >
            MAIN LAGI
          </button>
        </div>
      </div>
    </div>
  );
};

export const HandoverModal: React.FC<{
  nextPlayerName: string;
  nextPlayerCardId?: string;
  nextPlayerColor: string;
  onConfirm: () => void;
}> = ({ nextPlayerName, nextPlayerCardId, nextPlayerColor, onConfirm }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
    role="dialog"
    aria-modal="true"
  >
    <div className="w-full max-w-sm bg-[#0F172A] border-2 border-amber-500/80 rounded-2xl p-6 text-center shadow-2xl space-y-4">
      <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
        Giliran Berganti · Pass &amp; Play
      </div>
      <div className="flex justify-center py-2">
        <PlayerTokenSVG cardId={nextPlayerCardId} color={nextPlayerColor} size={64} />
      </div>
      <h2 className="text-xl font-bold text-[#F4F1EA]">
        Giliran {nextPlayerName}!
      </h2>
      <p className="text-xs text-slate-400">
        Serahkan perangkat kepada {nextPlayerName} untuk memulai giliran.
      </p>
      <button
        type="button"
        onClick={onConfirm}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
      >
        SAYA SIAP! LEMPAR DADU
      </button>
    </div>
  </div>
);

export const VictoryModal = MatchOverModal;
