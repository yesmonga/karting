import { useMemo, useState } from 'react';
import { LapTimeChart } from '@/components/charts/LapTimeChart';
import { StintBarChart } from '@/components/charts/StintBarChart';
import { lapData as defaultLapData, drivers as defaultDrivers, stintConfig as defaultStintConfig } from '@/data/raceData';
import { getAllDriverStats, getTop10Laps, getStintStats, getTheoreticalBest } from '@/utils/calculations';
import { msToTime, formatDiff } from '@/utils/timeFormat';
import { getAllRaces } from '@/utils/raceStorage';
import { Trophy, TrendingUp, TrendingDown, Minus, Zap, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImportedRace } from '@/types/race';

export default function StintAnalysis() {
  const races = useMemo(() => getAllRaces(), []);
  
  // Filters
  const [selectedRaceId, setSelectedRaceId] = useState<string>('default');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  
  // Get current race data
  const { currentLapData, currentDrivers, currentStintConfig, raceName } = useMemo(() => {
    if (selectedRaceId === 'default' || races.length === 0) {
      return {
        currentLapData: defaultLapData,
        currentDrivers: defaultDrivers,
        currentStintConfig: defaultStintConfig,
        raceName: '4H Endurance Lyon (Données par défaut)',
      };
    }
    
    const race = races.find(r => r.id === selectedRaceId);
    if (!race) {
      return {
        currentLapData: defaultLapData,
        currentDrivers: defaultDrivers,
        currentStintConfig: defaultStintConfig,
        raceName: '4H Endurance Lyon (Données par défaut)',
      };
    }
    
    return {
      currentLapData: race.laps,
      currentDrivers: race.drivers,
      currentStintConfig: race.stints,
      raceName: race.name,
    };
  }, [selectedRaceId, races]);
  
  // Get all unique drivers from selected race
  const availableDrivers = useMemo(() => {
    return Object.keys(currentDrivers);
  }, [currentDrivers]);
  
  // Filter lap data by driver if selected
  const filteredLapData = useMemo(() => {
    if (selectedDriver === 'all') return currentLapData;
    
    // Filter laps that belong to the selected driver's stints
    const driverStints = currentStintConfig.filter(s => s.driver === selectedDriver);
    return currentLapData.filter(lap => 
      driverStints.some(stint => lap.lap >= stint.startLap && lap.lap <= stint.endLap)
    );
  }, [currentLapData, selectedDriver, currentStintConfig]);
  
  const driverStats = useMemo(() => {
    const stats = getAllDriverStats(filteredLapData);
    if (selectedDriver !== 'all') {
      return stats.filter(s => s.driver === selectedDriver);
    }
    return stats;
  }, [filteredLapData, selectedDriver]);
  
  const top10Laps = useMemo(() => getTop10Laps(filteredLapData), [filteredLapData]);
  const stintStats = useMemo(() => {
    const stats = getStintStats(filteredLapData);
    if (selectedDriver !== 'all') {
      return stats.filter(s => s.driver === selectedDriver);
    }
    return stats;
  }, [filteredLapData, selectedDriver]);
  const theoretical = useMemo(() => getTheoreticalBest(filteredLapData), [filteredLapData]);
  
  const TrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const clearFilters = () => {
    setSelectedRaceId('default');
    setSelectedDriver('all');
  };

  const hasFilters = selectedRaceId !== 'default' || selectedDriver !== 'all';
  
  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="opacity-0 animate-slide-up">
          <h1 className="font-racing text-3xl font-bold mb-2">Analyse des Stints</h1>
          <p className="text-muted-foreground">
            Performance détaillée par pilote et par stint
          </p>
        </div>
        
        {/* Filters */}
        <div className="glass-card rounded-xl p-4 opacity-0 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Filtres</span>
            </div>
            
            {/* Race Filter */}
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedRaceId}
                onChange={(e) => setSelectedRaceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:border-primary"
              >
                <option value="default">Données par défaut</option>
                {races.map(race => (
                  <option key={race.id} value={race.id}>
                    {race.name} - {race.raceType} ({new Date(race.date).toLocaleDateString('fr-FR')})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Driver Filter */}
            <div className="min-w-[150px]">
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm focus:outline-none focus:border-primary"
              >
                <option value="all">Tous les pilotes</option>
                {availableDrivers.map(driver => (
                  <option key={driver} value={driver}>{driver}</option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>
          
          {/* Current Race Info */}
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{raceName}</span>
              {selectedDriver !== 'all' && (
                <span> • Pilote: <span className="text-primary">{selectedDriver}</span></span>
              )}
              <span className="ml-2">({filteredLapData.length} tours)</span>
            </p>
          </div>
        </div>
        
        {/* Driver Rankings Table */}
        <div className="glass-card rounded-xl p-5 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h2 className="font-racing text-lg font-bold mb-4">Classement Pilotes</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Pilote</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Tours</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Best</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Moyenne</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">σ</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Régularité</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody>
                {driverStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Aucune donnée disponible pour cette sélection
                    </td>
                  </tr>
                ) : (
                  driverStats.map((stats, index) => {
                    const driver = currentDrivers[stats.driver];
                    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
                    
                    return (
                      <tr key={stats.driver} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{medals[index] || `${index + 1}`}</span>
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-racing"
                              style={{ backgroundColor: `${driver?.color || '#666'}20`, color: driver?.color || '#666' }}
                            >
                              {driver?.code || '?'}
                            </div>
                            <span className="font-medium">{stats.driver}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-racing">{stats.laps}</td>
                        <td className="py-4 px-4 text-center font-racing text-green-400">{msToTime(stats.best)}</td>
                        <td className="py-4 px-4 text-center font-racing">{msToTime(Math.round(stats.avg))}</td>
                        <td className="py-4 px-4 text-center font-mono text-sm">{(stats.stdDev / 1000).toFixed(3)}s</td>
                        <td className="py-4 px-4 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded text-sm font-medium",
                            stats.consistency >= 40 && "bg-green-500/20 text-green-400",
                            stats.consistency >= 25 && stats.consistency < 40 && "bg-amber-500/20 text-amber-400",
                            stats.consistency < 25 && "bg-red-500/20 text-red-400"
                          )}>
                            {stats.consistency.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">{TrendIcon(stats.trend)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <LapTimeChart laps={filteredLapData} />
          </div>
          
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <StintBarChart laps={filteredLapData} />
          </div>
        </div>
        
        {/* Top 10 Laps */}
        <div className="glass-card rounded-xl p-5 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-racing text-lg font-bold">Top 10 Meilleurs Tours</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Tour</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Pilote</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Temps</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">S1</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">S2</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">S3</th>
                  <th className="text-center py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Écart</th>
                </tr>
              </thead>
              <tbody>
                {top10Laps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  top10Laps.map((lap, index) => {
                    const driver = currentDrivers[lap.driver];
                    const bestTime = top10Laps[0].total;
                    const diff = lap.total - bestTime;
                    
                    return (
                      <tr key={lap.lap} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-racing text-muted-foreground">{index + 1}</td>
                        <td className="py-3 px-4 font-racing">{lap.lap}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-racing"
                              style={{ backgroundColor: `${driver?.color || '#666'}20`, color: driver?.color || '#666' }}
                            >
                              {driver?.code || '?'}
                            </div>
                            <span className="text-sm">{lap.driver}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-racing text-green-400">{msToTime(lap.total)}</td>
                        <td className="py-3 px-4 text-center font-mono text-sm text-muted-foreground">
                          {(lap.s1 / 1000).toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-sm text-muted-foreground">
                          {(lap.s2 / 1000).toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-sm text-muted-foreground">
                          {(lap.s3 / 1000).toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-sm">
                          {index === 0 ? (
                            <span className="text-green-400">--</span>
                          ) : (
                            <span className="text-yellow-400">{formatDiff(diff)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Theoretical Best */}
        {filteredLapData.length > 0 && (
          <div className="glass-card rounded-xl p-5 opacity-0 animate-slide-up" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-400" />
              <h2 className="font-racing text-lg font-bold">Tour Théorique Optimal</h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <p className="text-xs text-muted-foreground uppercase mb-2">Secteur 1</p>
                <p className="font-racing text-2xl text-purple-400">{(theoretical.s1 / 1000).toFixed(3)}s</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <p className="text-xs text-muted-foreground uppercase mb-2">Secteur 2</p>
                <p className="font-racing text-2xl text-purple-400">{(theoretical.s2 / 1000).toFixed(3)}s</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <p className="text-xs text-muted-foreground uppercase mb-2">Secteur 3</p>
                <p className="font-racing text-2xl text-purple-400">{(theoretical.s3 / 1000).toFixed(3)}s</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/20 border border-purple-500/50 glow-red-subtle">
                <p className="text-xs text-muted-foreground uppercase mb-2">Total</p>
                <p className="font-racing text-2xl text-purple-400 font-bold">{msToTime(theoretical.total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}