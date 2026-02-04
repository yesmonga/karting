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

  return (
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden font-sans select-none">
      {/* Bouton changement kart (haut milieu) */}
      <button
        onClick={onChangeKart}
        className="absolute top-2 left-1/2 -translate-x-1/2 p-2 bg-black/50 rounded-full border border-primary/30 hover:bg-primary/20 z-50 opacity-50 hover:opacity-100"
      >
        <Settings className="w-4 h-4 text-primary" />
      </button>

      {/* Container Principal avec Padding de Sécurité */}
      <div className="flex flex-col h-full w-full p-2 gap-2">

        {/* === LIGNE HAUT (50%) === */}
        <div className="flex-1 flex gap-2">

          {/* GAUCHE: Position (Grossie) */}
          <div className="w-[20%] flex flex-col items-center justify-center bg-primary/20 rounded-lg border border-primary/20">
            <span className="text-[10px] text-primary/80 uppercase font-bold tracking-wider">POS</span>
            <span className="text-6xl font-racing font-bold text-primary leading-none shadow-black drop-shadow-lg">
              {myDriver.position}
            </span>
            <span className="text-sm text-muted-foreground font-mono mt-1">#{myDriver.kart}</span>
          </div>

          {/* CENTRE: Chronos / Secteurs */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Secteurs */}
            <div className="flex-1 flex items-center justify-between bg-card/20 rounded-lg px-2 border border-white/5">
              <SectorDisplay label="S1" current={myDriver.s1} best={bestS1} />
              <div className="w-px h-10 bg-white/10 mx-1"></div>
              <SectorDisplay label="S2" current={myDriver.s2} best={bestS2} />
              <div className="w-px h-10 bg-white/10 mx-1"></div>
              <SectorDisplay label="S3" current={myDriver.s3} best={bestS3} />
            </div>

            {/* Dernier Tour */}
            <div className="h-[45%] flex items-center justify-between bg-card/20 rounded-lg px-4 border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">DERNIER TOUR</span>
                <span className="text-4xl font-mono font-bold text-white tracking-tighter leading-none">
                  {myDriver.lastLap || '--:--.---'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-green-500/80 uppercase tracking-wider">MEILLEUR</span>
                <span className="text-xl font-mono text-green-400">
                  {myDriver.bestLap || '--:--.---'}
                </span>
              </div>
            </div>
          </div>

          {/* DROITE: Message Box / Info Course */}
          <div className={`w-[25%] flex flex-col items-center justify-center rounded-lg border border-white/10 transition-colors ${messageFlash ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-card/20'
            }`}>
            {latestMessage ? (
              <div className="text-center px-2 animate-pulse">
                <MessageSquare className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                <span className="text-sm font-bold text-yellow-400 leading-tight block break-words">
                  {latestMessage.text}
                </span>
              </div>
            ) : (
              <div className="text-center opacity-30">
                <MessageSquare className="w-8 h-8 mx-auto mb-1" />
                <span className="text-[10px] uppercase">Radio</span>
              </div>
            )}
          </div>

        </div>

        {/* === LIGNE BAS (50%) === */}
        <div className="flex-1 flex gap-2">

          {/* GAUCHE: Pilote Devant */}
          <div className="w-[30%] bg-blue-500/10 rounded-lg border border-blue-500/20 flex flex-col p-2 relative">
            <div className="flex items-center gap-1 text-blue-400 mb-1">
              <ArrowLeft className="w-3 h-3" />
              <span className="text-[9px] uppercase font-bold">DEVANT</span>
            </div>
            {driverAhead ? (
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">P{driverAhead.position}</span>
                  <span className="text-sm text-muted-foreground">#{driverAhead.kart}</span>
                </div>
                <span className="text-xl font-mono text-blue-400 font-bold mt-1">
                  {driverAhead.interval ? `-${driverAhead.interval}` : (myDriver.interval || '--')}
                </span>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-green-500 font-racing font-bold text-xl">LEADER</span>
              </div>
            )}
          </div>

          {/* CENTRE: Ecarts & Pit */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Écart Leader */}
            <div className="flex-1 flex items-center justify-center bg-card/20 rounded-lg border border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">GAP LEADER</span>
                <span className="text-4xl font-mono font-bold text-primary tracking-tighter">
                  {myDriver.gap || '+0.000'}
                </span>
              </div>
            </div>

            {/* Info Pit & Stint */}
            <div className={`flex-1 flex items-center justify-between rounded-lg px-4 border ${isPitting ? 'bg-orange-500/20 border-orange-500/50' : 'bg-card/20 border-white/5'}`}>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <Gauge className={`w-3 h-3 ${isPitting ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <span className="text-[10px] uppercase text-muted-foreground">PIT STOP</span>
                </div>
                <span className={`text-2xl font-mono font-bold ${isPitting ? 'text-orange-500 animate-pulse' : 'text-white/50'}`}>
                  {isPitting ? `${pitTimer}s` : 'EN PISTE'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block">STINT</span>
                <span className="text-xl font-bold text-white leading-none">
                  {myDriver.pits || '0'}<span className="text-sm text-muted-foreground">/5</span>
                </span>
              </div>
            </div>
          </div>

          {/* DROITE: Pilote Derrière */}
          <div className="w-[30%] bg-red-500/10 rounded-lg border border-red-500/20 flex flex-col p-2">
            <div className="flex items-center justify-end gap-1 text-red-500 mb-1">
              <span className="text-[9px] uppercase font-bold">DERRIÈRE</span>
              <ArrowRight className="w-3 h-3" />
            </div>
            {driverBehind ? (
              <div className="flex-1 flex flex-col justify-center items-center">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">P{driverBehind.position}</span>
                  <span className="text-sm text-muted-foreground">#{driverBehind.kart}</span>
                </div>
                <span className="text-xl font-mono text-red-500 font-bold mt-1">
                  {driverBehind.interval ? `+${driverBehind.interval}` : '+--'}
                </span>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-white/30 font-bold">DERNIER</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
