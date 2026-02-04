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

  // Heuristic: If S2 is significantly larger than S1 (> +50%), it's likely cumulative (Split 2)
  // Logic: S2_Sector = S2_Cumulative - S1_Sector
  let realS2Str = myDriver.s2;
  if (s1Sec > 0 && s2Sec > s1Sec + 5) {
    realS2Str = (s2Sec - s1Sec).toFixed(3);
  }

  // Heuristic: If S3 is significantly larger than S2 (> +20%), it's likely cumulative (Lap Time)
  // Logic: S3_Sector = S3_Cumulative - S2_Cumulative
  // Note: If S2 was cumulative, we use raw S2Sec. If S2 was sector, this logic might be tricky.
  // Usually if S2 is cumulative, S3 is also cumulative (Lap).
  let realS3Str = myDriver.s3;
  if (s2Sec > 0 && s3Sec > s2Sec + 5) {
    realS3Str = (s3Sec - s2Sec).toFixed(3);
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden font-sans select-none p-2">
      {/* Settings Button */}
      <button
        onClick={onChangeKart}
        className="absolute top-2 left-1/2 -translate-x-1/2 p-2 bg-black/50 rounded-full border border-primary/30 z-50 opacity-0 transition-opacity hover:opacity-100"
      >
        <Settings className="w-4 h-4 text-primary" />
      </button>

      <div className="grid grid-cols-12 grid-rows-2 gap-2 h-full">
        {/* === TOP ROW === */}

        {/* POSITION (Cols 1-3) */}
        <div className="col-span-3 bg-primary/20 rounded-xl border border-primary/30 flex flex-col items-center justify-center relative overflow-hidden">
          <span className="text-xs uppercase tracking-widest text-primary/80 font-bold absolute top-2">Position</span>
          <span className="text-[7rem] leading-none font-racing font-bold text-primary shadow-black drop-shadow-xl z-10">
            {myDriver.position}
          </span>
          <span className="text-lg font-mono text-white/50 absolute bottom-2">#{myDriver.kart}</span>
        </div>

        {/* SECTORS & TIMES (Cols 4-9) - The Core Data */}
        <div className="col-span-6 grid grid-rows-2 gap-2">
          {/* Row 1: Last Lap & Best Lap */}
          <div className="row-span-1 grid grid-cols-2 gap-2">
            <div className="bg-card/20 rounded-xl border border-white/5 flex flex-col items-center justify-center p-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Dernier Tour</span>
              <span className="text-4xl font-mono font-bold text-white tracking-tighter">
                {myDriver.lastLap || '--:--.---'}
              </span>
            </div>
            <div className="bg-card/20 rounded-xl border border-white/5 flex flex-col items-center justify-center p-2">
              <span className="text-xs text-green-500/80 uppercase tracking-wider">Meilleur Tour</span>
              <span className="text-4xl font-mono font-bold text-green-400 tracking-tighter">
                {myDriver.bestLap || '--:--.---'}
              </span>
            </div>
          </div>

          {/* Row 2: Sectors S1 - S2 - S3 */}
          <div className="row-span-1 grid grid-cols-3 gap-2">
            {/* Secteurs */}
            <div className="col-span-3 flex items-center justify-between bg-card/20 rounded-lg px-2 border border-white/5">
              <SectorDisplay label="S1" current={myDriver.s1} best={bestS1} />
              <div className="w-px h-10 bg-white/10 mx-1"></div>
              <SectorDisplay label="S2" current={realS2Str} best={bestS2} />
              <div className="w-px h-10 bg-white/10 mx-1"></div>
              <SectorDisplay label="S3" current={realS3Str} best={bestS3} />
            </div>
          </div>
        </div>

        {/* RADIO & PIT (Cols 10-12) */}
        <div className="col-span-3 flex flex-col gap-2">
          {/* Radio Message */}
          <div className={`flex-1 rounded-xl border flex flex-col items-center justify-center p-2 text-center transition-colors ${messageFlash ? 'bg-yellow-500/20 border-yellow-500 animate-pulse' : 'bg-card/20 border-white/10'
            }`}>
            {latestMessage ? (
              <>
                <MessageSquare className="w-8 h-8 text-yellow-500 mb-2" />
                <span className="text-lg font-bold text-yellow-400 leading-tight uppercase">
                  {latestMessage.text}
                </span>
              </>
            ) : (
              <>
                <MessageSquare className="w-6 h-6 text-white/20 mb-1" />
                <span className="text-xs text-white/20 uppercase">Radio Silent</span>
              </>
            )}
          </div>

          {/* Pit Timer / Info */}
          <div className={`h-1/3 rounded-xl border flex items-center justify-center gap-2 ${isPitting ? 'bg-orange-500/20 border-orange-500' : 'bg-card/20 border-white/10'
            }`}>
            <Gauge className={`w-5 h-5 ${isPitting ? 'text-orange-500' : 'text-muted-foreground'}`} />
            {isPitting ? (
              <span className="text-3xl font-mono font-bold text-orange-500">{pitTimer}s</span>
            ) : (
              <div className="text-center">
                <span className="text-xs text-muted-foreground block text-center">STINT</span>
                <span className="font-bold">{myDriver.pits || 0} <span className="text-xs font-normal text-muted-foreground">stops</span></span>
              </div>
            )}
          </div>
        </div>


        {/* === BOTTOM ROW (Gaps) === */}

        {/* DRIVER AHEAD (Cols 1-4) */}
        <div className="col-span-4 bg-blue-500/10 rounded-xl border border-blue-500/20 p-3 relative flex flex-col justify-between">
          <div className="absolute top-2 left-3 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-blue-500 uppercase">Devant</span>
          </div>

          {driverAhead ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-racing font-bold text-white">P{driverAhead.position}</span>
                <span className="text-xl text-white/50">#{driverAhead.kart}</span>
              </div>
              <span className="text-4xl font-mono font-bold text-blue-400 mt-2">
                {driverAhead.interval ? `-${driverAhead.interval}` : (myDriver.interval || '--')}
              </span>
              <span className="text-xs text-blue-300/50 mt-1 uppercase max-w-full truncate">{driverAhead.team}</span>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-3xl font-racing text-green-500 animate-pulse">LEADER</span>
            </div>
          )}
        </div>

        {/* GAP LEADER / RACE INFO (Cols 5-8) */}
        <div className="col-span-4 bg-card/20 rounded-xl border border-white/5 flex flex-col items-center justify-center p-4">
          <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Gap Leader</span>
          <span className="text-6xl font-mono font-bold text-white tracking-tighter">
            {myDriver.gap || '+0.000'}
          </span>
          <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-mono text-white/70">
              {formatTime(raceTimeRemaining)} restants
            </span>
          </div>
        </div>

        {/* DRIVER BEHIND (Cols 9-12) */}
        <div className="col-span-4 bg-red-500/10 rounded-xl border border-red-500/20 p-3 relative flex flex-col justify-between">
          <div className="absolute top-2 right-3 flex items-center gap-1">
            <span className="text-xs font-bold text-red-500 uppercase">Derrière</span>
            <ArrowRight className="w-4 h-4 text-red-500" />
          </div>

          {driverBehind ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-racing font-bold text-white">P{driverBehind.position}</span>
                <span className="text-xl text-white/50">#{driverBehind.kart}</span>
              </div>
              <span className="text-4xl font-mono font-bold text-red-500 mt-2">
                {driverBehind.interval ? `+${driverBehind.interval}` : '+--'}
              </span>
              <span className="text-xs text-red-300/50 mt-1 uppercase max-w-full truncate">{driverBehind.team}</span>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-2xl font-racing text-white/30">DERNIER</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
