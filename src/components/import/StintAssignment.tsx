import { useState, useMemo } from 'react';
import { ImportedStint, ImportedDriver, ImportedLapData } from '@/types/race';
import { getSavedDrivers, SavedDriver } from '@/utils/raceStorage';
import { msToTime } from '@/utils/timeFormat';
import { User, Plus, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StintAssignmentProps {
  stints: Array<{ stint: number; startLap: number; endLap: number }>;
  laps: ImportedLapData[];
  onComplete: (assignedStints: ImportedStint[], drivers: Record<string, ImportedDriver>) => void;
}

const DRIVER_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export function StintAssignment({ stints, laps, onComplete }: StintAssignmentProps) {
  const savedDrivers = getSavedDrivers();
  const [drivers, setDrivers] = useState<SavedDriver[]>(savedDrivers);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [newDriverName, setNewDriverName] = useState('');
  const [showAddDriver, setShowAddDriver] = useState(false);

  // Calculate stint statistics
  const stintStats = useMemo(() => {
    return stints.map(stint => {
      const stintLaps = laps.filter(
        l => l.lap >= stint.startLap && l.lap <= stint.endLap && l.total > 0 && l.total < 120000
      );
      
      const times = stintLaps.map(l => l.total);
      const best = times.length > 0 ? Math.min(...times) : 0;
      const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      
      return {
        ...stint,
        lapCount: stintLaps.length,
        best,
        avg,
      };
    });
  }, [stints, laps]);

  const handleAssign = (stintNumber: number, driverName: string) => {
    setAssignments(prev => ({
      ...prev,
      [stintNumber]: driverName,
    }));
  };

  const addDriver = () => {
    if (!newDriverName.trim()) return;
    
    const name = newDriverName.trim().toUpperCase();
    const code = String.fromCharCode(65 + drivers.length); // A, B, C, ...
    const color = DRIVER_COLORS[drivers.length % DRIVER_COLORS.length];
    
    const newDriver: SavedDriver = {
      name,
      fullName: name,
      code,
      color,
    };
    
    setDrivers(prev => [...prev, newDriver]);
    setNewDriverName('');
    setShowAddDriver(false);
  };

  const removeDriver = (name: string) => {
    setDrivers(prev => prev.filter(d => d.name !== name));
    // Remove assignments for this driver
    setAssignments(prev => {
      const newAssignments = { ...prev };
      Object.keys(newAssignments).forEach(key => {
        if (newAssignments[parseInt(key)] === name) {
          delete newAssignments[parseInt(key)];
        }
      });
      return newAssignments;
    });
  };

  const handleComplete = () => {
    const assignedStints: ImportedStint[] = stints.map(stint => {
      const driverName = assignments[stint.stint] || 'INCONNU';
      const driver = drivers.find(d => d.name === driverName);
      
      return {
        stint: stint.stint,
        driver: driverName,
        code: driver?.code || '?',
        startLap: stint.startLap,
        endLap: stint.endLap,
      };
    });

    const driversRecord: Record<string, ImportedDriver> = {};
    drivers.forEach(d => {
      driversRecord[d.name] = {
        name: d.name,
        fullName: d.fullName,
        code: d.code,
        color: d.color,
      };
    });

    onComplete(assignedStints, driversRecord);
  };

  const allAssigned = stints.every(s => assignments[s.stint]);

  return (
    <div className="space-y-6">
      {/* Drivers Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-racing text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Pilotes
          </h3>
          <button
            onClick={() => setShowAddDriver(true)}
            className="text-sm flex items-center gap-1 text-primary hover:underline"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {drivers.map(driver => (
            <div
              key={driver.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50"
              style={{ borderLeft: `3px solid ${driver.color}` }}
            >
              <span className="font-medium text-sm">{driver.name}</span>
              <span className="text-xs text-muted-foreground">({driver.code})</span>
              {drivers.length > 1 && (
                <button
                  onClick={() => removeDriver(driver.name)}
                  className="p-0.5 rounded hover:bg-secondary"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {showAddDriver && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={newDriverName}
              onChange={(e) => setNewDriverName(e.target.value)}
              placeholder="Nom du pilote"
              className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && addDriver()}
            />
            <button
              onClick={addDriver}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowAddDriver(false)}
              className="px-3 py-2 rounded-lg bg-secondary text-sm"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Stint Assignment */}
      <div>
        <h3 className="font-racing text-lg mb-3">Assignation des Stints</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Assignez un pilote à chaque stint détecté
        </p>
        
        <div className="space-y-3">
          {stintStats.map(stint => (
            <div
              key={stint.stint}
              className="p-4 rounded-xl bg-secondary/30 border border-border/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-racing text-primary">Stint {stint.stint}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    Tours {stint.startLap} → {stint.endLap} ({stint.lapCount} tours)
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {stint.best > 0 && (
                    <span className="text-green-400 mr-3">Best: {msToTime(stint.best)}</span>
                  )}
                  {stint.avg > 0 && (
                    <span>Moy: {msToTime(Math.round(stint.avg))}</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {drivers.map(driver => (
                  <button
                    key={driver.name}
                    onClick={() => handleAssign(stint.stint, driver.name)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      assignments[stint.stint] === driver.name
                        ? "ring-2 ring-offset-2 ring-offset-background"
                        : "opacity-60 hover:opacity-100"
                    )}
                    style={{
                      backgroundColor: `${driver.color}20`,
                      color: driver.color,
                      borderColor: driver.color,
                      ...(assignments[stint.stint] === driver.name && { ringColor: driver.color }),
                    }}
                  >
                    {driver.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={!allAssigned}
        className={cn(
          "w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
          allAssigned
            ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-red"
            : "bg-secondary text-muted-foreground cursor-not-allowed"
        )}
      >
        <Save className="w-5 h-5" />
        Enregistrer la course
      </button>
      
      {!allAssigned && (
        <p className="text-sm text-center text-amber-400">
          Assignez un pilote à chaque stint pour continuer
        </p>
      )}
    </div>
  );
}
