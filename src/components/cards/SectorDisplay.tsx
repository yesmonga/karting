import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface Sector {
  name: string;
  time: number;
  best: number;
  driver?: string;
}

interface SectorDisplayProps {
  sectors: Sector[];
  className?: string;
}

export function SectorDisplay({ sectors, className }: SectorDisplayProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {sectors.map((sector, index) => {
        const diff = sector.time - sector.best;
        const isRecord = diff === 0;
        const isGood = diff < 100;
        const isBad = diff > 300;
        
        return (
          <div 
            key={sector.name}
            className={cn(
              "glass-card rounded-xl p-4 text-center transition-all duration-300",
              isRecord && "border-purple-500/50 glow-red-subtle",
              isGood && !isRecord && "border-green-500/30",
              isBad && "border-yellow-500/30"
            )}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {sector.name}
            </p>
            
            <p className={cn(
              "font-racing text-xl font-bold",
              isRecord && "text-purple-400",
              isGood && !isRecord && "text-green-400",
              isBad && "text-yellow-400"
            )}>
              {(sector.time / 1000).toFixed(3)}s
            </p>
            
            <div className={cn(
              "flex items-center justify-center gap-1 mt-2 text-xs",
              isRecord && "text-purple-400",
              diff > 0 && !isRecord && "text-yellow-400",
              diff < 0 && "text-green-400"
            )}>
              {isRecord ? (
                <>
                  <Zap className="w-3 h-3" />
                  <span>RECORD!</span>
                </>
              ) : (
                <>
                  {diff > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span>{diff > 0 ? '+' : ''}{(diff / 1000).toFixed(3)}s</span>
                </>
              )}
            </div>
            
            {sector.driver && (
              <p className="text-[10px] text-muted-foreground mt-1">
                vs best ({sector.driver})
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
