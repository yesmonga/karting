import { cn } from '@/lib/utils';
import { User, Timer, Trophy, Target, TrendingUp } from 'lucide-react';
import { Driver, StintConfig } from '@/data/raceData';
import { DriverStats } from '@/utils/calculations';
import { msToTime, calculateStintProgress } from '@/utils/timeFormat';

interface CurrentDriverCardProps {
  driver: Driver;
  stint: StintConfig;
  stats: DriverStats;
  lastLap?: { total: number; s1: number; s2: number; s3: number };
  currentLap: number;
  className?: string;
}

export function CurrentDriverCard({ 
  driver, 
  stint, 
  stats, 
  lastLap,
  currentLap,
  className 
}: CurrentDriverCardProps) {
  const progress = calculateStintProgress(currentLap, stint.startLap, stint.endLap);
  const stintLapsCompleted = currentLap - stint.startLap + 1;
  const stintTotalLaps = stint.endLap - stint.startLap + 1;
  
  return (
    <div className={cn(
      "glass-card rounded-xl p-6 border-primary/30",
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-racing font-bold uppercase tracking-wider">Pilote en Piste</h3>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Driver Info */}
        <div className="flex items-center gap-4">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold font-racing glow-red"
            style={{ backgroundColor: `${driver.color}30`, color: driver.color }}
          >
            {driver.code}
          </div>
          
          <div>
            <h2 className="font-racing text-2xl font-bold">{driver.fullName}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span 
                className="px-2 py-0.5 rounded text-sm font-bold"
                style={{ backgroundColor: `${driver.color}20`, color: driver.color }}
              >
                {driver.code}
              </span>
              <span className="text-sm text-muted-foreground">
                Stint {stint.stint} • Tour {stintLapsCompleted}/{stintTotalLaps}
              </span>
            </div>
          </div>
        </div>
        
        {/* Lap Times */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Dernier Tour</p>
            <p className="font-racing text-xl font-bold">
              {lastLap ? msToTime(lastLap.total) : '--:--.---'}
            </p>
          </div>
          
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Best Stint</p>
            <p className="font-racing text-xl font-bold text-green-400">
              {msToTime(stats.best)}
            </p>
          </div>
          
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Moyenne Stint</p>
            <p className="font-racing text-xl font-bold">
              {msToTime(Math.round(stats.avg))}
            </p>
          </div>
          
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Régularité</p>
            <p className="font-racing text-xl font-bold text-amber-400">
              {stats.consistency.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Stint Progress */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Progression du stint</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 animate-pulse-glow"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${driver.color}, ${driver.color}99)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
