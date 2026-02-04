import { useState } from 'react';
import { GripVertical, User, Clock, Zap, TrendingUp } from 'lucide-react';
import { Driver } from './DriverManager';
import { msToTime } from '@/utils/timeFormat';
import { cn } from '@/lib/utils';

export interface StintData {
  stintNumber: number;
  startLap: number;
  endLap: number;
  lapCount: number;
  bestLapMs: number;
  avgLapMs: number;
  trackTimeMs?: number;
  assignedDriverId: string | null;
}

interface StintDragDropProps {
  stints: StintData[];
  drivers: Driver[];
  onStintsChange: (stints: StintData[]) => void;
}

export function StintDragDrop({ stints, drivers, onStintsChange }: StintDragDropProps) {
  const [draggedDriverId, setDraggedDriverId] = useState<string | null>(null);
  const [dragOverStint, setDragOverStint] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, driverId: string) => {
    setDraggedDriverId(driverId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedDriverId(null);
    setDragOverStint(null);
  };

  const handleDragOver = (e: React.DragEvent, stintNumber: number) => {
    e.preventDefault();
    setDragOverStint(stintNumber);
  };

  const handleDrop = (e: React.DragEvent, stintNumber: number) => {
    e.preventDefault();
    if (draggedDriverId) {
      const updatedStints = stints.map(stint =>
        stint.stintNumber === stintNumber
          ? { ...stint, assignedDriverId: draggedDriverId }
          : stint
      );
      onStintsChange(updatedStints);
    }
    setDraggedDriverId(null);
    setDragOverStint(null);
  };

  const clearAssignment = (stintNumber: number) => {
    const updatedStints = stints.map(stint =>
      stint.stintNumber === stintNumber
        ? { ...stint, assignedDriverId: null }
        : stint
    );
    onStintsChange(updatedStints);
  };

  const getDriver = (driverId: string | null) => {
    if (!driverId) return null;
    return drivers.find(d => d.id === driverId);
  };

  const allAssigned = stints.every(s => s.assignedDriverId);
  const assignedCount = stints.filter(s => s.assignedDriverId).length;

  return (
    <div className="space-y-6">
      {/* Draggable Drivers */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          Glissez les pilotes vers les stints
        </h4>
        <div className="flex flex-wrap gap-3">
          {drivers.map(driver => (
            <div
              key={driver.id}
              draggable
              onDragStart={(e) => handleDragStart(e, driver.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing transition-all",
                "bg-secondary/50 border-2 border-transparent hover:border-primary/50",
                draggedDriverId === driver.id && "opacity-50 scale-95"
              )}
              style={{ borderLeftColor: driver.color, borderLeftWidth: '4px' }}
            >
              <User className="w-4 h-4" style={{ color: driver.color }} />
              <span className="font-medium">{driver.name}</span>
              <span className="text-xs text-muted-foreground">({driver.code})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stint Slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Stints à assigner ({assignedCount}/{stints.length})
          </h4>
          {allAssigned && (
            <span className="text-sm text-green-400 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Tous les stints sont assignés
            </span>
          )}
        </div>

        <div className="space-y-3">
          {stints.map(stint => {
            const driver = getDriver(stint.assignedDriverId);
            const isDragOver = dragOverStint === stint.stintNumber;

            return (
              <div
                key={stint.stintNumber}
                onDragOver={(e) => handleDragOver(e, stint.stintNumber)}
                onDragLeave={() => setDragOverStint(null)}
                onDrop={(e) => handleDrop(e, stint.stintNumber)}
                className={cn(
                  "p-4 rounded-xl border-2 border-dashed transition-all",
                  isDragOver && "border-primary bg-primary/10",
                  driver && "border-solid",
                  !driver && !isDragOver && "border-border/50 bg-secondary/20"
                )}
                style={driver ? { 
                  borderColor: driver.color,
                  backgroundColor: `${driver.color}10`
                } : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-racing text-xl text-primary">S{stint.stintNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        T{stint.startLap}→{stint.endLap}
                      </div>
                    </div>

                    <div className="h-12 w-px bg-border/30" />

                    {driver ? (
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => clearAssignment(stint.stintNumber)}
                      >
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: driver.color }}
                        >
                          {driver.code}
                        </div>
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-xs text-muted-foreground group-hover:text-destructive">
                            Cliquer pour retirer
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic flex items-center gap-2">
                        <User className="w-5 h-5 opacity-50" />
                        Déposez un pilote ici
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Tours
                      </div>
                      <div className="font-medium">{stint.lapCount}</div>
                    </div>
                    {stint.bestLapMs > 0 && (
                      <div className="text-center">
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Meilleur
                        </div>
                        <div className="font-medium text-green-400">
                          {msToTime(stint.bestLapMs)}
                        </div>
                      </div>
                    )}
                    {stint.avgLapMs > 0 && (
                      <div className="text-center">
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Moyenne
                        </div>
                        <div className="font-medium">
                          {msToTime(stint.avgLapMs)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
