import { cn } from '@/lib/utils';
import { Driver } from '@/data/raceData';
import { DriverStats } from '@/utils/calculations';
import { msToTime } from '@/utils/timeFormat';
import { TrendingUp, TrendingDown, Minus, Trophy, Clock, Target } from 'lucide-react';

interface DriverCardProps {
  driver: Driver;
  stats: DriverStats;
  rank: number;
  isActive?: boolean;
  className?: string;
}

const rankIcons = ['🥇', '🥈', '🥉', '4️⃣'];

export function DriverCard({ driver, stats, rank, isActive = false, className }: DriverCardProps) {
  const TrendIcon = stats.trend === 'up' ? TrendingUp : stats.trend === 'down' ? TrendingDown : Minus;
  
  return (
    <div 
      className={cn(
        "glass-card-hover rounded-xl p-5 transition-all duration-300",
        isActive && "border-primary/50 glow-red-subtle",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar / Rank */}
        <div className="relative">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: `${driver.color}20` }}
          >
            <span style={{ color: driver.color }}>{driver.code}</span>
          </div>
          <div className="absolute -top-2 -right-2 text-lg">
            {rankIcons[rank] || `${rank + 1}`}
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-racing font-bold text-lg truncate">{driver.name}</h3>
            <div 
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${driver.color}20`, color: driver.color }}
            >
              {driver.code}
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">{driver.fullName}</p>
          
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-racing text-sm">{msToTime(stats.best)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-sm">{stats.laps} tours</span>
            </div>
            <div className={cn(
              "flex items-center gap-1.5",
              stats.trend === 'up' && "text-green-400",
              stats.trend === 'down' && "text-red-400",
              stats.trend === 'stable' && "text-muted-foreground"
            )}>
              <TrendIcon className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/30">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Moyenne</p>
          <p className="font-racing text-sm">{msToTime(Math.round(stats.avg))}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Écart-type</p>
          <p className="font-racing text-sm">{(stats.stdDev / 1000).toFixed(3)}s</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Régularité</p>
          <p className="font-racing text-sm">{stats.consistency.toFixed(1)}%</p>
        </div>
      </div>
      
      {/* Best Sectors */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground">S1</p>
          <p className="font-mono text-xs">{(stats.bestS1 / 1000).toFixed(3)}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground">S2</p>
          <p className="font-mono text-xs">{(stats.bestS2 / 1000).toFixed(3)}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground">S3</p>
          <p className="font-mono text-xs">{(stats.bestS3 / 1000).toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
}
