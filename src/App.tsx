import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AIThinkingState, BoardGrid2D } from './components/BoardGrid2D';
import { CityTabletop3D } from './components/CityTabletop3D';
import { BlockBoulevardEmblem, PlayerTokenSVG, TierBadgeSVG } from './components/GameTokensSVG';
import {
  HandoverModal,
  HowToPlayModal,
  PauseModal,
  SetupModal,
  VictoryModal,
} from './components/Modals';
import { PlayerRosterPanel } from './components/PlayerRosterPanel';
import { PropertyInspectorPanel } from './components/PropertyInspectorPanel';
import {
  planAIRollDeliberation,
  shouldAIBuyProperty,
  shouldAILeaveHolding,
  stepAITurn,
} from './game/ai';
import { BOARD_TILES, CHARACTER_CARD_CATALOG, formatRupiah } from './game/boardData';
import {
  advanceMovementStepAction,
  applyEventCardAction,
  buyPropertyAction,
  confirmHandoverAction,
  createInitialGameState,
  declareBankruptcyAction,
  endTurnAction,
  leaveHoldingBeforeRollAction,
  passPropertyAction,
  rollDiceWithGaugeAction,
  sellDevelopmentAction,
  upgradePropertyAction,
} from './game/engine';
import { GameConfig, GameMode, GameState } from './game/types';
import { soundFX } from './utils/sound';
import {
  clearSavedGameState,
  loadSavedGameState,
  saveGameState,
} from './utils/storage';

type ShellScreen = 'title' | 'playing' | 'paused';
type MobileDrawerTab = 'none' | 'players' | 'property';

function buildDefaultQuickMatchConfig(): GameConfig {
  return {
    mode: 'QUICK_MATCH',
    quickGameMaxRounds: null,
    players: [
      {
        id: 'player-1',
        name: 'Kapten Nusantara',
        cardId: CHARACTER_CARD_CATALOG[0].id,
        token: CHARACTER_CARD_CATALOG[0].avatarId,
        color: CHARACTER_CARD_CATALOG[0].color,
        isAI: false,
      },
      {
        id: 'player-2',
        name: 'Gatotkaca AI',
        cardId: CHARACTER_CARD_CATALOG[1].id,
        token: CHARACTER_CARD_CATALOG[1].avatarId,
        color: CHARACTER_CARD_CATALOG[1].color,
        isAI: true,
        aiDifficulty: 'HARD',
      },
      {
        id: 'player-3',
        name: 'Dewi Sri AI',
        cardId: CHARACTER_CARD_CATALOG[2].id,
        token: CHARACTER_CARD_CATALOG[2].avatarId,
        color: CHARACTER_CARD_CATALOG[2].color,
        isAI: true,
        aiDifficulty: 'NORMAL',
      },
      {
        id: 'player-4',
        name: 'Sultan Celebes AI',
        cardId: CHARACTER_CARD_CATALOG[3].id,
        token: CHARACTER_CARD_CATALOG[3].avatarId,
        color: CHARACTER_CARD_CATALOG[3].color,
        isAI: true,
        aiDifficulty: 'NORMAL',
      },
    ],
  };
}

export default function App() {
  const isAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [lastConfig, setLastConfig] = useState<GameConfig>(buildDefaultQuickMatchConfig);
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(buildDefaultQuickMatchConfig())
  );
  const [screen, setScreen] = useState<ShellScreen>(() =>
    isAutostart ? 'playing' : 'title'
  );
  const [savedMatch, setSavedMatch] = useState<GameState | null>(() =>
    loadSavedGameState()
  );

  // Modals on Title or Playing
  const [setupMode, setSetupMode] = useState<GameMode | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isRollingAnim, setIsRollingAnim] = useState(false);
  const [show3DView, setShow3DView] = useState(false);
  const [muted, setMuted] = useState(() => soundFX.isMuted());
  const [mobileTab, setMobileTab] = useState<MobileDrawerTab>('none');

  const stepIndexRef = useRef(0);

  // Sync document.body.dataset.state
  useEffect(() => {
    if (screen === 'title') {
      document.body.dataset.state = 'title';
    } else if (gameState.turnPhase === 'GAME_OVER') {
      document.body.dataset.state = 'gameover';
    } else if (screen === 'paused') {
      document.body.dataset.state = 'paused';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [screen, gameState.turnPhase]);

  // Persist active match to localStorage
  useEffect(() => {
    if (screen === 'playing') {
      saveGameState(gameState);
      if (gameState.turnPhase === 'GAME_OVER') {
        if (gameState.monopolyVictory) {
          soundFX.playMonopolyWin();
        } else {
          soundFX.playVictory();
        }
        setSavedMatch(null);
      }
    }
  }, [gameState, screen]);

  // Start a new match immediately
  const startMatchWithConfig = useCallback((config: GameConfig) => {
    soundFX.playClick();
    clearSavedGameState();
    setLastConfig(config);
    const fresh = createInitialGameState(config);
    setGameState(fresh);
    setSetupMode(null);
    setScreen('playing');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  // Continue saved match from localStorage
  const handleContinueSavedMatch = useCallback(() => {
    if (!savedMatch) return;
    soundFX.playClick();
    setGameState(savedMatch);
    setScreen('playing');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [savedMatch]);

  // Step-by-step token movement timer with relaxed Let's Get Rich rhythm (260ms per hop)
  useEffect(() => {
    if (screen !== 'playing' || gameState.turnPhase !== 'MOVING') {
      stepIndexRef.current = 0;
      return;
    }

    const timer = window.setTimeout(() => {
      soundFX.playStep(stepIndexRef.current);
      stepIndexRef.current += 1;
      setGameState((prev) => advanceMovementStepAction(prev));
    }, 260);

    return () => clearTimeout(timer);
  }, [screen, gameState.turnPhase, gameState.movementQueue.length]);

  const [aiThinking, setAiThinking] = useState<AIThinkingState | null>(null);

  // AI Deliberation and Turn Management (Authentic 3-4s rhythm inspired by LINE Let's Get Rich)
  useEffect(() => {
    if (screen !== 'playing') {
      setAiThinking(null);
      return;
    }
    const activePlayer = gameState.players[gameState.currentPlayerIndex];
    if (!activePlayer || !activePlayer.isAI || activePlayer.isBankrupt) {
      setAiThinking(null);
      return;
    }
    if (gameState.turnPhase === 'MOVING' || gameState.turnPhase === 'GAME_OVER') {
      setAiThinking(null);
      return;
    }

    // 1. WAITING_FOR_ROLL: 3.4s deliberation sequence with gauge windup
    if (gameState.turnPhase === 'WAITING_FOR_ROLL') {
      const plan = planAIRollDeliberation(gameState);

      // Phase 1 (0 to 1200ms): Pondering / Evaluating board
      setAiThinking({
        active: true,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        cardId: activePlayer.cardId,
        thought: plan.thought,
        powerRatio: 0,
        targetZone: plan.targetZone,
        phase: 'pondering',
      });

      let climbInterval: number | undefined;
      let rollTimer: number | undefined;
      let animTimer: number | undefined;

      // Phase 2 (1200ms): Begin charging dice power gauge
      const chargeTimer = window.setTimeout(() => {
        soundFX.startGaugeCharge();
        setAiThinking((prev) =>
          prev
            ? {
                ...prev,
                phase: 'charging',
                thought: `Mengisi Tenaga Dadu... Target Zona ${plan.targetZone} (${plan.targetTileName})!`,
              }
            : null
        );

        const startTime = Date.now();
        const duration = 1400;
        climbInterval = window.setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / duration);
          const currentRatio = progress * plan.powerRatio;
          setAiThinking((prev) => (prev ? { ...prev, powerRatio: currentRatio } : null));
          if (progress >= 1 && climbInterval) {
            clearInterval(climbInterval);
          }
        }, 40);

        // Phase 3 (2600ms): Release gauge and roll!
        const releaseTimer = window.setTimeout(() => {
          if (climbInterval) clearInterval(climbInterval);
          soundFX.playGaugeRelease(plan.isDiceControl);
          setAiThinking((prev) =>
            prev
              ? {
                  ...prev,
                  phase: 'releasing',
                  powerRatio: plan.powerRatio,
                  thought: plan.isDiceControl
                    ? 'LEMPAR! Akurasi Dadu Kontrol Aktif!'
                    : 'LEMPAR DADU!',
                }
              : null
          );

          // Phase 4 (3000ms): Execute roll in game engine
          rollTimer = window.setTimeout(() => {
            soundFX.playDiceRoll();
            setIsRollingAnim(true);
            animTimer = window.setTimeout(() => {
              setIsRollingAnim(false);
              setAiThinking(null);

              let nextState = gameState;
              if (activePlayer.inHolding) {
                const decision = shouldAILeaveHolding(nextState);
                if (decision.leave) {
                  nextState = leaveHoldingBeforeRollAction(nextState, decision.useCard);
                }
              }
              setGameState(rollDiceWithGaugeAction(nextState, plan.powerRatio));
            }, 280);
          }, 400);
        }, 1400);

        return () => {
          if (climbInterval) clearInterval(climbInterval);
          clearTimeout(releaseTimer);
          if (rollTimer) clearTimeout(rollTimer);
          if (animTimer) clearTimeout(animTimer);
          soundFX.stopGaugeCharge();
        };
      }, 1200);

      return () => {
        clearTimeout(chargeTimer);
        if (climbInterval) clearInterval(climbInterval);
        if (rollTimer) clearTimeout(rollTimer);
        if (animTimer) clearTimeout(animTimer);
        soundFX.stopGaugeCharge();
      };
    }

    // 2. BUY_OR_PASS: 1.8s decision delay
    if (gameState.turnPhase === 'BUY_OR_PASS') {
      const tile = BOARD_TILES[activePlayer.position];
      const willBuy = shouldAIBuyProperty(gameState);
      setAiThinking({
        active: true,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        cardId: activePlayer.cardId,
        thought: `${activePlayer.name} mempertimbangkan pembelian ${tile?.name ?? 'properti'} (${formatRupiah(
          tile?.purchasePrice ?? 0
        )})...`,
        powerRatio: 0,
        phase: 'pondering',
      });

      const timer = window.setTimeout(() => {
        setAiThinking(null);
        if (willBuy) {
          soundFX.playPurchase();
          setGameState((prev) => buyPropertyAction(prev));
        } else {
          soundFX.playClick();
          setGameState((prev) => passPropertyAction(prev));
        }
      }, 1800);

      return () => clearTimeout(timer);
    }

    // 3. EVENT_DECISION: 1.5s delay
    if (gameState.turnPhase === 'EVENT_DECISION') {
      setAiThinking({
        active: true,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        cardId: activePlayer.cardId,
        thought: `${activePlayer.name} membuka Kartu Kesempatan Takdir...`,
        powerRatio: 0,
        phase: 'pondering',
      });
      const timer = window.setTimeout(() => {
        setAiThinking(null);
        soundFX.playEventCard();
        setGameState((prev) => applyEventCardAction(prev));
      }, 1500);
      return () => clearTimeout(timer);
    }

    // 4. MANAGING_PROPERTIES / EXTRA_ROLL / DEBT_RESOLUTION: 1.2s delay
    const standardTimer = window.setTimeout(() => {
      setAiThinking(null);
      setGameState((prev) => stepAITurn(prev));
    }, 1200);

    return () => clearTimeout(standardTimer);
  }, [
    screen,
    gameState.currentPlayerIndex,
    gameState.turnPhase,
    gameState.players,
  ]);

  // Human Player Handlers
  const handleRollDice = useCallback((powerRatio: number = 0.5) => {
    if (
      gameState.turnPhase !== 'WAITING_FOR_ROLL' &&
      gameState.turnPhase !== 'EXTRA_ROLL'
    ) {
      return;
    }
    const active = gameState.players[gameState.currentPlayerIndex];
    if (!active || active.isAI) return;

    soundFX.playDiceRoll();
    setIsRollingAnim(true);
    window.setTimeout(() => {
      setIsRollingAnim(false);
      setGameState((prev) => rollDiceWithGaugeAction(prev, powerRatio));
    }, 280);
  }, [gameState.turnPhase, gameState.players, gameState.currentPlayerIndex]);

  const handleBuyProperty = useCallback(() => {
    soundFX.playPurchase();
    setGameState((prev) => buyPropertyAction(prev));
  }, []);

  const handlePassProperty = useCallback(() => {
    soundFX.playClick();
    setGameState((prev) => passPropertyAction(prev));
  }, []);

  const handleApplyEventCard = useCallback(() => {
    soundFX.playEventCard();
    setGameState((prev) => applyEventCardAction(prev));
  }, []);

  const handleEndTurn = useCallback(() => {
    soundFX.playClick();
    setGameState((prev) => endTurnAction(prev));
  }, []);

  const handleLeaveHolding = useCallback((useCard: boolean) => {
    soundFX.playPurchase();
    setGameState((prev) => leaveHoldingBeforeRollAction(prev, useCard));
  }, []);

  const handleUpgradeProperty = useCallback((tileIndex: number) => {
    const active = gameState.players[gameState.currentPlayerIndex];
    if (!active) return;
    soundFX.playUpgrade();
    setGameState((prev) => upgradePropertyAction(prev, active.id, tileIndex));
  }, [gameState.players, gameState.currentPlayerIndex]);

  const handleSellDevelopment = useCallback((tileIndex: number) => {
    const active = gameState.players[gameState.currentPlayerIndex];
    if (!active) return;
    soundFX.playClick();
    setGameState((prev) => sellDevelopmentAction(prev, active.id, tileIndex));
  }, [gameState.players, gameState.currentPlayerIndex]);

  const handleDeclareBankruptcy = useCallback(() => {
    soundFX.playClick();
    setGameState((prev) => declareBankruptcyAction(prev));
  }, []);

  const handleSelectTile = useCallback((tileIndex: number) => {
    soundFX.playClick();
    setGameState((prev) => ({
      ...prev,
      selectedTileIndex: tileIndex,
    }));
  }, []);

  const handleToggleMute = useCallback(() => {
    const newMuted = soundFX.toggleMute();
    setMuted(newMuted);
  }, []);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  // User character card info for lobby
  const lobbyUserCard = CHARACTER_CARD_CATALOG[0];

  // ============================================================================
  // 1. TITLE / LOBBY SCREEN (LINE Let's Get Rich Indonesia Redesign)
  // ============================================================================
  if (screen === 'title') {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-[#070D18] text-[#F4F1EA] flex flex-col select-none">
        {/* Background 3D Turntable Scene */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <CityTabletop3D gameState={gameState} mode="title" />
        </div>

        {/* Let's Get Rich Top Header Bar */}
        <header className="relative z-20 flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-amber-500/30 backdrop-blur-md">
          {/* Left: Player Profile Frame (Class S+ Avatar) */}
          <div className="flex items-center gap-3">
            <div className="relative p-1 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-500 to-yellow-600 border border-yellow-200 shadow-lg">
              <PlayerTokenSVG cardId={lobbyUserCard.id} color={lobbyUserCard.color} size={42} />
              <div className="absolute -bottom-1 -right-1">
                <TierBadgeSVG tier={lobbyUserCard.tier} className="text-[10px]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-yellow-300 tracking-wide">
                  {lobbyUserCard.name}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                  Lv.30 Max
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {lobbyUserCard.title} · DC {lobbyUserCard.diceControl}%
              </div>
            </div>
          </div>

          {/* Right: Currency Badges & Utility */}
          <div className="flex items-center gap-3">
            {/* Gold Currency Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-amber-500/40 shadow-inner">
              <span className="text-amber-400 text-sm">🪙</span>
              <span className="font-mono font-bold text-xs text-amber-300">
                Rp 1.500.000
              </span>
            </div>

            {/* Diamond Currency Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 border border-sky-500/40 shadow-inner">
              <span className="text-sky-400 text-sm">💎</span>
              <span className="font-mono font-bold text-xs text-sky-300">
                1.250
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setShowHowToPlay(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Panduan Main
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </header>

        {/* Center Turntable Body */}
        <div className="relative z-10 flex-1 flex flex-col justify-between p-6 max-w-7xl mx-auto w-full pointer-events-none">
          {/* Main Logo & Indonesian Let's Get Rich subtitle */}
          <div className="pointer-events-auto max-w-lg mt-4 space-y-4">
            <BlockBoulevardEmblem className="w-full max-w-md drop-shadow-2xl" />

            {/* Character Card Spotlight Card */}
            <div className="p-4 rounded-2xl bg-slate-900/85 border border-amber-500/30 backdrop-blur-md shadow-2xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  KARTU KARAKTER UTAMA
                </span>
                <TierBadgeSVG tier={lobbyUserCard.tier} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Dice Control</div>
                  <div className="font-mono font-bold text-sky-400 text-sm mt-0.5">
                    {lobbyUserCard.diceControl}% Akurasi
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Diskon Sewa</div>
                  <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
                    {lobbyUserCard.tollDiscount}% Proteksi
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Jelajahi 6 distrik kota nusantara (Medan, Bandung, Surabaya, Makassar, Denpasar, Jakarta), kuasai 4 bandara utama, dan raih kemenangan instan <strong>Line Monopoly</strong>!
              </p>
            </div>
          </div>

          {/* Bottom Action Dock (Big Let's Get Rich Buttons) */}
          <div className="pointer-events-auto flex flex-col sm:flex-row items-center gap-3 pt-4">
            {/* Primary Instant-Play CTA with data-start="true" */}
            <button
              type="button"
              data-start="true"
              onClick={() => startMatchWithConfig(buildDefaultQuickMatchConfig())}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.98] text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🎮</span>
              <span>MAIN SEKARANG (VS AI)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setSetupMode('LOCAL_FRIENDS');
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>👥</span>
              <span>MULTIPLAYER TEMAN (PASS &amp; PLAY)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setSetupMode('QUICK_MATCH');
              }}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
            >
              Pilih Ruang &amp; Karakter Deck
            </button>

            {savedMatch && (
              <button
                type="button"
                onClick={handleContinueSavedMatch}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/60 shadow-lg transition-colors cursor-pointer"
              >
                Lanjutkan Laga (Putaran {savedMatch.roundNumber})
              </button>
            )}
          </div>
        </div>

        {/* Modals on Title Screen */}
        {setupMode && (
          <SetupModal
            initialMode={setupMode}
            onStartMatch={startMatchWithConfig}
            onCancel={() => setSetupMode(null)}
          />
        )}
        {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
      </main>
    );
  }

  // ============================================================================
  // 2. PLAYING SHELL (Responsive Full-Viewport Desktop 3-Column + Mobile Adaptive)
  // ============================================================================
  const activeCard = currentPlayer
    ? CHARACTER_CARD_CATALOG.find((c) => c.id === currentPlayer.cardId)
    : null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0A111F] text-[#F4F1EA] flex flex-col select-none">
      {/* Compact Game HUD Top Bar */}
      <div className="h-11 px-3 sm:px-4 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Game Identity & Mode */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-sm sm:text-base tracking-tight text-[#F4F1EA] whitespace-nowrap">
            BLOCK &amp; <span className="text-amber-400">BOULEVARD</span>
            <span className="ml-2 text-xs text-amber-400/80 font-normal hidden md:inline">
              Nusantara Edition
            </span>
          </span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline text-xs text-slate-400 truncate">
            {gameState.mode === 'QUICK_MATCH' ? 'Tanding vs AI' : 'Pass & Play Teman'}
          </span>
        </div>

        {/* Center: Active Player Status Pill */}
        {currentPlayer && (
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <PlayerTokenSVG
              cardId={currentPlayer.cardId}
              token={currentPlayer.token}
              color={currentPlayer.color}
              size={22}
            />
            {activeCard && <TierBadgeSVG tier={activeCard.tier} />}
            <span className="font-bold text-[#F4F1EA] truncate max-w-[110px] sm:max-w-none">
              {currentPlayer.name}
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-mono font-bold text-amber-400">
              {formatRupiah(currentPlayer.money)}
            </span>
          </div>
        )}

        {/* Right: Utility Buttons (Panduan, Suara, Jeda) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              soundFX.playClick();
              setShowHowToPlay(true);
            }}
            aria-label="Panduan Bermain"
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 cursor-pointer"
          >
            Panduan
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              handleToggleMute();
            }}
            aria-label={muted ? 'Aktifkan Suara' : 'Matikan Suara'}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 cursor-pointer"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              soundFX.playClick();
              setScreen('paused');
            }}
            aria-label="Jeda Permainan"
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            JEDA
          </button>
        </div>
      </div>

      {/* Main Responsive 3-Column Tabletop Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Player Roster & Net Worth (Hidden on mobile <1024px) */}
        <aside className="hidden lg:block w-72 xl:w-80 h-full p-2.5 border-r border-slate-800 shrink-0">
          <PlayerRosterPanel gameState={gameState} onSelectTile={handleSelectTile} />
        </aside>

        {/* Center: Interactive Board */}
        <section className="flex-1 h-full min-w-0 flex items-center justify-center p-1 sm:p-2 overflow-hidden">
          <BoardGrid2D
            gameState={gameState}
            isRollingAnim={isRollingAnim}
            show3DView={show3DView}
            aiThinking={aiThinking}
            onToggle3DView={() => setShow3DView((prev) => !prev)}
            onSelectTile={handleSelectTile}
            onRollDice={handleRollDice}
            onBuyProperty={handleBuyProperty}
            onPassProperty={handlePassProperty}
            onApplyEventCard={handleApplyEventCard}
            onEndTurn={handleEndTurn}
            onLeaveHolding={handleLeaveHolding}
            onUpgradeProperty={handleUpgradeProperty}
            onSellDevelopment={handleSellDevelopment}
            onDeclareBankruptcy={handleDeclareBankruptcy}
          />
        </section>

        {/* Right Column: Property Deed Inspector & Activity Log (Hidden on mobile <1024px) */}
        <aside className="hidden lg:block w-80 xl:w-88 h-full p-2.5 border-l border-slate-800 shrink-0">
          <PropertyInspectorPanel
            gameState={gameState}
            onUpgradeProperty={handleUpgradeProperty}
            onSellDevelopment={handleSellDevelopment}
          />
        </aside>
      </div>

      {/* Mobile Drawer Bar (Visible only on screens <1024px) */}
      <div className="lg:hidden h-12 bg-[#0F172A] border-t border-slate-800 flex items-center justify-around px-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab((prev) => (prev === 'players' ? 'none' : 'players'))}
          className={`flex-1 py-1.5 mx-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            mobileTab === 'players' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
          }`}
        >
          Pemain ({gameState.players.filter((p) => !p.isBankrupt).length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab((prev) => (prev === 'property' ? 'none' : 'property'))}
          className={`flex-1 py-1.5 mx-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            mobileTab === 'property' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
          }`}
        >
          Aset #{gameState.selectedTileIndex}
        </button>
      </div>

      {/* Mobile Slide-Up Drawer */}
      {mobileTab !== 'none' && (
        <div className="lg:hidden fixed inset-x-0 bottom-12 top-28 z-40 bg-[#0F172A]/98 border-t-2 border-amber-500 p-3 flex flex-col shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {mobileTab === 'players' ? 'Daftar Pemain' : 'Detail Petak'}
            </span>
            <button
              type="button"
              onClick={() => setMobileTab('none')}
              className="px-3 py-1 rounded bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Tutup
            </button>
          </div>
          {mobileTab === 'players' ? (
            <PlayerRosterPanel
              gameState={gameState}
              onSelectTile={(idx) => {
                handleSelectTile(idx);
                setMobileTab('property');
              }}
            />
          ) : (
            <PropertyInspectorPanel
              gameState={gameState}
              onUpgradeProperty={handleUpgradeProperty}
              onSellDevelopment={handleSellDevelopment}
            />
          )}
        </div>
      )}

      {/* Local Friends Pass-and-Play Handover Screen */}
      {gameState.turnPhase === 'HANDOVER' && currentPlayer && (
        <HandoverModal
          nextPlayerName={currentPlayer.name}
          nextPlayerCardId={currentPlayer.cardId}
          nextPlayerColor={currentPlayer.color}
          onConfirm={() => {
            soundFX.playClick();
            setGameState((prev) => confirmHandoverAction(prev));
          }}
        />
      )}

      {/* How to Play Modal */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* Pause Modal */}
      {screen === 'paused' && (
        <PauseModal
          muted={muted}
          onToggleMute={handleToggleMute}
          onResume={() => setScreen('playing')}
          onRestart={() => startMatchWithConfig(lastConfig)}
          onMainMenu={() => {
            saveGameState(gameState);
            setSavedMatch(gameState);
            setScreen('title');
          }}
        />
      )}

      {/* Victory / Match Over Modal */}
      {gameState.turnPhase === 'GAME_OVER' && (
        <VictoryModal
          gameState={gameState}
          onPlayAgain={() => startMatchWithConfig(lastConfig)}
          onMainMenu={() => {
            clearSavedGameState();
            setSavedMatch(null);
            setScreen('title');
          }}
        />
      )}
    </main>
  );
}
