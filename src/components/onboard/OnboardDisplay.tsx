import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, MessageSquare, Gauge, Settings } from 'lucide-react';
import { ApexDriverData } from '@/types/live';
import { TeamDetails } from '@/hooks/useTeamDetails';

interface OnboardDisplayProps {
  myDriver: ApexDriverData | null | undefined;
  myDetails: TeamDetails | null;
  driverAhead: ApexDriverData | null | undefined;
  driverBehind: ApexDriverData | null | undefined;
  latestMessage: { text: string; timestamp: Date } | null;
  raceTimeRemaining: number;
  onChangeKart: () => void;
}

function formatTime(ms: number): string {
  if (!ms) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function SectorDisplay({
  label,
  current,
  best,
  overallBest,
}: {
  label: string;
  current: string;
  best: number;
  overallBest?: number;
}) {
  // Nettoyer le temps des emojis potentiels
  const cleanCurrent = current?.replace(/[🟢🟣🔴⚪]/gu, '').trim() || '';
  const currentMs = parseFloat(cleanCurrent) * 1000 || 0;
  const diff = currentMs > 0 && best > 0 ? (currentMs - best) / 1000 : null;

  // Déterminer la couleur du diff :
  // - Violet (purple) : meilleur temps absolu de la course (overall best)
  // - Vert : amélioration de notre meilleur temps personnel
  // - Rouge : plus lent que notre meilleur
  const isOverallBest = overallBest && currentMs > 0 && currentMs <= overallBest;
  const isPersonalBest = diff !== null && diff < -0.01;
  const isSlower = diff !== null && diff > 0.01;

  let diffColor = 'text-yellow-400'; // neutre
  if (isOverallBest) {
    diffColor = 'text-purple-400';
  } else if (isPersonalBest) {
    diffColor = 'text-green-400';
  } else if (isSlower) {
    diffColor = 'text-red-400';
  }

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      <span className="text-2xl font-mono font-bold text-white leading-none">
        {cleanCurrent || '--'}
      </span>
      {diff !== null && (
        <span className={`text-sm font-mono font-bold ${diffColor}`}>
          {diff > 0 ? '+' : ''}
          {diff.toFixed(2)}
        </span>
      )}
    </div>
  );
}

export function OnboardDisplay({
  myDriver,
  myDetails,
  driverAhead,
  driverBehind,
  latestMessage,
  raceTimeRemaining,
  onChangeKart,
}: OnboardDisplayProps) {
  const [pitTimer, setPitTimer] = useState(0);
  const [isPitting, setIsPitting] = useState(false);
  const [messageFlash, setMessageFlash] = useState(false);

  // Détecter le pit (onTrack vide ou "P")
  useEffect(() => {
    const isInPit = !myDriver?.onTrack || myDriver.onTrack === 'P' || myDriver.onTrack === '';

    if (isInPit && !isPitting) {
      setIsPitting(true);
      setPitTimer(0);
    } else if (!isInPit && isPitting) {
      setIsPitting(false);
    }
  }, [myDriver?.onTrack, isPitting]);

  // Timer du pit
  useEffect(() => {
    if (!isPitting) return;
    const interval = setInterval(() => {
      setPitTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPitting]);

  // Flash du message
  useEffect(() => {
    if (latestMessage) {
      setMessageFlash(true);
      const timeout = setTimeout(() => setMessageFlash(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [latestMessage?.timestamp]);

  if (!myDriver) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Chargement...</div>
      </div>
    );
  }

  const bestS1 = myDetails?.bestSectors?.s1 || 0;
  const bestS2 = myDetails?.bestSectors?.s2 || 0;
  const bestS3 = myDetails?.bestSectors?.s3 || 0;

  // --- START FIX: S2/S3 Calculation ---
  // Helper to parse "23.456" or "1:03.456" into seconds
  const parseSeconds = (str: string | undefined) => {
    if (!str) return 0;
    const clean = str.replace(/[^\d:.]/g, ''); // Remove emojis etc
    if (clean.includes(':')) {
      const parts = clean.split(':');
      return (parseInt(parts[0]) * 60) + parseFloat(parts[1]);
    }
    return parseFloat(clean) || 0;
  };

  const s1Sec = parseSeconds(myDriver.s1);
  const s2Sec = parseSeconds(myDriver.s2);
  const s3Sec = parseSeconds(myDriver.s3);

  // Heuristic: If S2 is significantly larger than S1 (> +20s), it's likely cumulative
  let realS2Str = myDriver.s2;
  if (s1Sec > 0 && s2Sec > s1Sec + 20) {
    realS2Str = (s2Sec - s1Sec).toFixed(3);
  }

  // Heuristic: If S3 is significantly larger than S2 (> +20s), it's likely cumulative
  let realS3Str = myDriver.s3;
  if (s2Sec > 0 && s3Sec > s2Sec + 20) {
    realS3Str = (s3Sec - s2Sec).toFixed(3);
  }
  // --- END FIX ---

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Bouton changement kart */}
      <button
        onClick={onChangeKart}
        className="absolute top-1 right-1 p-1.5 bg-black/50 rounded-full border border-primary/30 hover:bg-primary/20 z-50"
      >
        <Settings className="w-3 h-3 text-primary" />
      </button>

      {/* Layout principal en grille - utilise tout l'écran */}
      <div className="grid grid-cols-12 grid-rows-2 gap-0.5 h-full w-full p-0.5">
        {/* === LIGNE 1 : Position, Secteurs, Temps, Message === */}

        {/* Position */}
        <div className="col-span-1 row-span-1 flex flex-col items-center justify-center bg-primary/20 rounded">
          <span className="text-5xl font-racing font-bold text-primary leading-none">
            P{myDriver.position}
          </span>
          <span className="text-[10px] text-muted-foreground">#{myDriver.kart}</span>
        </div>

        {/* Secteurs */}
        <div className="col-span-6 row-span-1 flex items-center justify-around bg-card/50 rounded">
          <SectorDisplay label="S1" current={myDriver.s1} best={bestS1} />
          <SectorDisplay label="S2" current={realS2Str} best={bestS2} />
          <SectorDisplay label="S3" current={realS3Str} best={bestS3} />
        </div>

        {/* Dernier tour / Meilleur tour */}
        <div className="col-span-4 row-span-1 flex flex-col items-center justify-center bg-card/50 rounded">
          <span className="text-[9px] text-muted-foreground uppercase">DERNIER</span>
          <span className="text-3xl font-mono font-bold text-white leading-none">{myDriver.lastLap || '--'}</span>
          <span className="text-[10px] text-green-400">BEST: {myDriver.bestLap || '--'}</span>
        </div>

        {/* Message du PC */}
        <div
          className={`col-span-1 row-span-1 flex flex-col items-center justify-center rounded transition-all ${messageFlash ? 'bg-yellow-500/40 animate-pulse' : 'bg-card/50'
            }`}
        >
          {latestMessage ? (
            <div className="text-center px-1">
              <MessageSquare className="w-4 h-4 text-yellow-400 mx-auto" />
              <span className="text-[8px] font-racing font-bold text-yellow-400 animate-pulse leading-none break-all">
                {latestMessage.text}
              </span>
            </div>
          ) : (
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* === LIGNE 2 : Kart devant, Écarts, Pit Timer, Kart derrière, Tour === */}

        {/* Kart devant */}
        <div className="col-span-2 row-span-1 flex flex-col items-center justify-center bg-blue-500/20 rounded">
          <div className="flex items-center gap-0.5 text-blue-400">
            <ArrowLeft className="w-3 h-3" />
            <span className="text-[9px] uppercase">DEVANT</span>
          </div>
          {driverAhead ? (
            <>
              <span className="text-2xl font-bold leading-none">P{driverAhead.position}</span>
              <span className="text-[10px] text-muted-foreground">K#{driverAhead.kart}</span>
              <span className="text-base font-mono text-blue-400 leading-none">
                {driverAhead.interval ? `-${driverAhead.interval}` : myDriver.interval || '--'}
              </span>
            </>
          ) : (
            <span className="text-green-400 font-bold text-lg">LEADER</span>
          )}
        </div>

        {/* Écarts GAP / INTERVAL */}
        <div className="col-span-6 row-span-1 flex items-center justify-around bg-card/50 rounded">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground uppercase">GAP LEADER</span>
            <span className="text-2xl font-mono font-bold text-primary leading-none">
              {myDriver.gap || '--'}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-muted-foreground uppercase">INTERVAL</span>
            <span className="text-2xl font-mono font-bold text-white leading-none">
              {myDriver.interval || '--'}
            </span>
          </div>
        </div>

        {/* Pit Timer */}
        <div
          className={`col-span-2 row-span-1 flex flex-col items-center justify-center rounded ${isPitting ? 'bg-orange-500/30' : 'bg-card/50'
            }`}
        >
          <div className="flex items-center gap-0.5 text-orange-400">
            <Gauge className="w-3 h-3" />
            <span className="text-[9px] uppercase">PIT</span>
          </div>
          <span className={`text-3xl font-mono font-bold leading-none ${isPitting ? 'text-orange-400' : 'text-white'}`}>
            {isPitting ? `${pitTimer}s` : '--'}
          </span>
          <span className="text-[9px] text-muted-foreground">{myDriver.pits || '0'}/5</span>
        </div>

        {/* Kart derrière */}
        <div className="col-span-2 row-span-1 flex flex-col items-center justify-center bg-red-500/20 rounded">
          <div className="flex items-center gap-0.5 text-red-400">
            <span className="text-[9px] uppercase">DERRIÈRE</span>
            <ArrowRight className="w-3 h-3" />
          </div>
          {driverBehind ? (
            <>
              <span className="text-2xl font-bold leading-none">P{driverBehind.position}</span>
              <span className="text-[10px] text-muted-foreground">K#{driverBehind.kart}</span>
              <span className="text-base font-mono text-red-400 leading-none">+{driverBehind.interval || '--'}</span>
            </>
          ) : (
            <span className="text-muted-foreground font-bold text-lg">DERNIER</span>
          )}
        </div>

      </div>
    </div>
  );
}
