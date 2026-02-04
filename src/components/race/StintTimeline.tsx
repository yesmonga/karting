import { cn } from '@/lib/utils';
import { StintConfig, drivers } from '@/data/raceData';

interface StintTimelineProps {
  stints: StintConfig[];
  currentStint?: number;
  currentLap?: number;
  className?: string;
}

export function StintTimeline({ stints, currentStint = 7, currentLap = 207, className }: StintTimelineProps) {
  const totalLaps = stints[stints.length - 1]?.endLap || 207;
  
  return (
    <div className={cn("glass-card rounded-xl p-5", className)}>
      <h3 className="font-racing text-sm font-bold mb-4 uppercase tracking-wider">
        Timeline des Stints
      </h3>
      
      <div className="relative">
        {/* Progress bar background */}
        <div className="h-8 bg-secondary/30 rounded-lg overflow-hidden flex">
          {stints.map((stint, index) => {
            const driver = drivers[stint.driver];
            const stintLaps = stint.endLap - stint.startLap + 1;
            const width = (stintLaps / totalLaps) * 100;
            const isActive = currentStint === stint.stint;
            const isPast = stint.stint < currentStint;
            
            return (
              <div
                key={stint.stint}
                className={cn(
                  "h-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative",
                  isActive && "animate-pulse-glow"
                )}
                style={{ 
                  width: `${width}%`,
                  backgroundColor: isPast || isActive ? driver.color : `${driver.color}30`,
                  opacity: isPast ? 0.6 : 1,
                }}
              >
                <span className={cn(
                  "text-[10px] font-racing",
                  (isPast || isActive) ? "text-white" : "text-muted-foreground"
                )}>
                  {stint.code}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Current position marker */}
        <div 
          className="absolute top-0 h-8 w-0.5 bg-white shadow-lg"
          style={{ left: `${(currentLap / totalLaps) * 100}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {Object.entries(drivers).map(([key, driver]) => (
          <div key={key} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: driver.color }}
            />
            <span className="text-xs text-muted-foreground">{driver.name}</span>
          </div>
        ))}
      </div>
      
      {/* Stint details */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4 pt-4 border-t border-border/30">
        {stints.map((stint) => {
          const driver = drivers[stint.driver];
          const isActive = currentStint === stint.stint;
          
          return (
            <div 
              key={stint.stint}
              className={cn(
                "p-2 rounded-lg text-center transition-all",
                isActive ? "bg-primary/20 border border-primary/30" : "bg-secondary/20"
              )}
            >
              <p className="text-[10px] text-muted-foreground">Stint {stint.stint}</p>
              <p 
                className="font-racing text-sm font-bold"
                style={{ color: driver.color }}
              >
                {stint.driver}
              </p>
              <p className="text-[10px] text-muted-foreground">
                T{stint.startLap}-{stint.endLap}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
