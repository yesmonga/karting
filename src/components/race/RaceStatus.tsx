import { cn } from '@/lib/utils';
import { Flag, Timer, Trophy, Gauge } from 'lucide-react';
import { CurrentStatus, raceInfo } from '@/data/raceData';
import { msToTime } from '@/utils/timeFormat';

interface RaceStatusProps {
  status: CurrentStatus;
  bestLap?: number;
  avgLap?: number;
  className?: string;
}

export function RaceStatus({ status, bestLap, avgLap, className }: RaceStatusProps) {
  return (
    <div className={cn(
      "glass-card rounded-xl p-5 border-primary/30 glow-red-subtle",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Flag className="w-5 h-5 text-primary" />
          <span className="font-racing font-bold uppercase tracking-wider">
            Course en direct
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
          <div className="status-live" />
          <span className="text-xs text-green-400 font-medium">Connecté</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Position</p>
          <p className="font-racing text-2xl font-bold">
            P{status.position}<span className="text-muted-foreground text-lg">/{status.totalKarts}</span>
          </p>
        </div>
        
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tours</p>
          <p className="font-racing text-2xl font-bold">
            {status.currentLap}<span className="text-muted-foreground text-lg">/{status.totalLaps}</span>
          </p>
        </div>
        
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Temps</p>
          <p className="font-racing text-2xl font-bold text-primary">{status.elapsedTime}</p>
        </div>
        
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Écart P1</p>
          <p className="font-racing text-2xl font-bold text-amber-400">+2 tours</p>
        </div>
        
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Best Lap</p>
          <p className="font-racing text-2xl font-bold text-green-400">
            {bestLap ? msToTime(bestLap) : '--:--.---'}
          </p>
        </div>
        
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Moyenne</p>
          <p className="font-racing text-2xl font-bold">
            {avgLap ? msToTime(Math.round(avgLap)) : '--:--.---'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30">
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{raceInfo.trackName}</span> • {raceInfo.raceType}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-racing">
          Kart #{raceInfo.kartNumber}
        </span>
      </div>
    </div>
  );
}
