import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTER_CARD_CATALOG } from '../game/boardData';
import { PlayerState } from '../game/types';
import { soundFX } from '../utils/sound';

interface DicePowerGaugeProps {
  player: PlayerState;
  disabled: boolean;
  onRoll: (powerRatio: number) => void;
  className?: string;
}

export const DicePowerGauge: React.FC<DicePowerGaugeProps> = ({
  player,
  disabled,
  onRoll,
  className = '',
}) => {
  const [charging, setCharging] = useState(false);
  const [power, setPower] = useState(0); // 0 to 1
  const chargeStartRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const directionRef = useRef<number>(1); // 1 = ascending, -1 = bouncing back

  const card = CHARACTER_CARD_CATALOG.find((c) => c.id === player.cardId);
  const diceControl = card?.diceControl ?? 75;

  // Compute active target zone
  let targetZone: { name: string; range: string; color: string; badge: string };
  if (power < 0.25) {
    targetZone = { name: 'LOW', range: '2 - 4', color: 'from-emerald-500 to-teal-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  } else if (power < 0.5) {
    targetZone = { name: 'MID-LOW', range: '5 - 7', color: 'from-sky-500 to-cyan-400', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
  } else if (power < 0.75) {
    targetZone = { name: 'MID-HIGH', range: '8 - 9', color: 'from-amber-500 to-yellow-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  } else {
    targetZone = { name: 'HIGH', range: '10 - 12', color: 'from-rose-500 to-orange-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  }

  const updateCharge = useCallback(() => {
    if (!charging) return;
    const now = performance.now();
    const elapsed = now - (chargeStartRef.current ?? now);
    const cycleDuration = 1200; // 1.2s to fill gauge

    // Smooth ping-pong cycle 0 -> 1 -> 0 if user holds long
    const cycleFraction = (elapsed % cycleDuration) / cycleDuration;
    const cyclePhase = Math.floor(elapsed / cycleDuration) % 2;
    const currentPower = cyclePhase === 0 ? cycleFraction : 1 - cycleFraction;

    setPower(Math.max(0.05, Math.min(0.99, currentPower)));
    animFrameRef.current = requestAnimationFrame(updateCharge);
  }, [charging]);

  useEffect(() => {
    if (charging) {
      animFrameRef.current = requestAnimationFrame(updateCharge);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [charging, updateCharge]);

  const handleStart = (e?: React.SyntheticEvent) => {
    if (disabled || charging) return;
    e?.preventDefault();
    chargeStartRef.current = performance.now();
    directionRef.current = 1;
    setCharging(true);
    setPower(0.08);
    soundFX.startGaugeCharge();
  };

  const handleRelease = (e?: React.SyntheticEvent) => {
    if (disabled || !charging) return;
    e?.preventDefault();
    setCharging(false);
    const finalRatio = power;
    soundFX.playGaugeRelease(true);
    onRoll(finalRatio);
    // Reset after roll
    setTimeout(() => setPower(0), 400);
  };

  // Keyboard Spacebar trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !disabled && !charging) {
        e.preventDefault();
        handleStart();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && charging) {
        e.preventDefault();
        handleRelease();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, charging, power]);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Target Zone & Card DC Bonus Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider border transition-all duration-150 ${
            charging ? targetZone.badge : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}
        >
          {charging ? `${targetZone.name} [${targetZone.range}]` : 'HOLD TO CHARGE DICE'}
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono font-semibold">
          <span>DC</span>
          <span className="font-bold">{diceControl}%</span>
        </div>
      </div>

      {/* Let's Get Rich Arch / Bar Gauge */}
      <div className="w-full max-w-[280px] h-3.5 bg-slate-900/90 rounded-full p-0.5 border border-slate-700/80 shadow-inner overflow-hidden mb-3 relative">
        {/* Zone markers */}
        <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10 opacity-30 text-[8px] font-mono font-bold text-slate-400 items-center">
          <span className="w-1/4 text-center border-r border-slate-600/50">LOW</span>
          <span className="w-1/4 text-center border-r border-slate-600/50">MID-L</span>
          <span className="w-1/4 text-center border-r border-slate-600/50">MID-H</span>
          <span className="w-1/4 text-center">HIGH</span>
        </div>

        {/* Dynamic fill bar */}
        <div
          className={`h-full rounded-full transition-all duration-75 bg-gradient-to-r ${targetZone.color} shadow-lg`}
          style={{ width: `${Math.max(power * 100, 3)}%` }}
        />
      </div>

      {/* Big Tactile Let's Get Rich Dice Gauge Button */}
      <button
        type="button"
        disabled={disabled}
        onMouseDown={handleStart}
        onMouseUp={handleRelease}
        onMouseLeave={charging ? handleRelease : undefined}
        onTouchStart={handleStart}
        onTouchEnd={handleRelease}
        className={`relative group px-8 py-3.5 rounded-2xl font-bold font-mono tracking-wider transition-all duration-150 active:scale-95 shadow-xl flex items-center gap-3 border ${
          disabled
            ? 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
            : charging
            ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-600 text-slate-950 border-yellow-200 ring-4 ring-amber-400/50 shadow-amber-500/50 scale-105'
            : 'bg-gradient-to-b from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:to-teal-600 text-white border-emerald-300 shadow-emerald-950/60'
        }`}
      >
        {/* Rotating 3D Dice Icon */}
        <div
          className={`w-7 h-7 rounded-lg bg-white/20 border border-white/40 flex items-center justify-center font-black text-sm transition-transform duration-200 ${
            charging ? 'animate-bounce text-amber-950' : 'text-white'
          }`}
        >
          🎲
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[13px] font-black uppercase tracking-widest leading-none">
            {charging ? 'LEPASKAN DADU!' : 'LEMPAR DADU'}
          </span>
          <span className="text-[10px] font-medium opacity-80 leading-tight mt-0.5">
            {charging ? `Target: ${targetZone.range}` : 'Tekan & Tahan Gauge'}
          </span>
        </div>
      </button>
    </div>
  );
};
