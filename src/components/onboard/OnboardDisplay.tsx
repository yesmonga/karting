import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, MessageSquare, Gauge, Settings } from 'lucide-react';
import { ApexDriverData } from '@/types/live';
import { TeamDetails } from '@/hooks/useTeamDetails';
import { calculateRealSectors, parseTime } from '@/utils/raceUtils';

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
  // Use robust parsing for mm:ss.ms
  const currentMs = parseTime(current) * 1000;

  // If current is 0, we can't compare
  const diff = currentMs > 0 && best > 0 ? (currentMs - best) / 1000 : null;

  // Colors
  const isOverallBest = overallBest && currentMs > 0 && currentMs <= overallBest;
  // Personal best if we are faster (negative diff)
  const isPersonalBest = diff !== null && diff < -0.01;
  const isSlower = diff !== null && diff > 0.01;

  let diffColor = 'text-yellow-400';
  if (isOverallBest) {
    diffColor = 'text-purple-400';
  } else if (isPersonalBest) {
    diffColor = 'text-green-400';
  } else if (isSlower) {
    diffColor = 'text-red-400';
  }

  const displayValue = current?.replace(/[🟢🟣🔴⚪]/gu, '').trim() || '--';

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      <span className="text-2xl font-mono font-bold text-white leading-none">
        {displayValue}
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

  // Use shared utility to calculate real sector times (handling cumulative splits)
  const { s1: s1Str, s2: realS2Str, s3: realS3Str } = calculateRealSectors(
    myDriver.s1,
    myDriver.s2,
    myDriver.s3
  );

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
