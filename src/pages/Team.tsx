import { useMemo } from 'react';
import { DriverCard } from '@/components/cards/DriverCard';
import { lapData, drivers } from '@/data/raceData';
import { getAllDriverStats, getTheoreticalBest } from '@/utils/calculations';
import { msToTime } from '@/utils/timeFormat';
import { Users, Trophy, Target, Clock, Zap } from 'lucide-react';

export default function Team() {
  const driverStats = useMemo(() => getAllDriverStats(lapData), []);
  const theoretical = useMemo(() => getTheoreticalBest(lapData), []);
  
  // Find best in each category
  const bestLapDriver = driverStats[0];
  const mostConsistent = [...driverStats].sort((a, b) => b.consistency - a.consistency)[0];
  const mostLaps = [...driverStats].sort((a, b) => b.laps - a.laps)[0];
  const bestS1 = [...driverStats].sort((a, b) => a.bestS1 - b.bestS1)[0];
  const bestS2 = [...driverStats].sort((a, b) => a.bestS2 - b.bestS2)[0];
  const bestS3 = [...driverStats].sort((a, b) => a.bestS3 - b.bestS3)[0];
  
  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="opacity-0 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="font-racing text-3xl font-bold">L'Équipe</h1>
          </div>
          <p className="text-muted-foreground">
            Profils détaillés des pilotes DNF KART TEAM
          </p>
        </div>
        
        {/* Highlights */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Meilleur Tour</p>
              <p className="font-racing font-bold" style={{ color: drivers[bestLapDriver.driver].color }}>
                {bestLapDriver.driver}
              </p>
              <p className="text-sm text-green-400">{msToTime(bestLapDriver.best)}</p>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Plus Régulier</p>
              <p className="font-racing font-bold" style={{ color: drivers[mostConsistent.driver].color }}>
                {mostConsistent.driver}
              </p>
              <p className="text-sm text-muted-foreground">{mostConsistent.consistency.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Plus de Tours</p>
              <p className="font-racing font-bold" style={{ color: drivers[mostLaps.driver].color }}>
                {mostLaps.driver}
              </p>
              <p className="text-sm text-muted-foreground">{mostLaps.laps} tours</p>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Tour Théorique</p>
              <p className="font-racing font-bold text-purple-400">{msToTime(theoretical.total)}</p>
              <p className="text-sm text-muted-foreground">Best S1+S2+S3</p>
            </div>
          </div>
        </div>
        
        {/* Driver Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {driverStats.map((stats, index) => (
            <div 
              key={stats.driver}
              className="opacity-0 animate-slide-up"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <DriverCard
                driver={drivers[stats.driver]}
                stats={stats}
                rank={index}
                isActive={false}
              />
            </div>
          ))}
        </div>
        
        {/* Best Sectors by Driver */}
        <div className="glass-card rounded-xl p-5 opacity-0 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <h2 className="font-racing text-lg font-bold mb-4">Records par Secteur</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Secteur 1</span>
                <div 
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: `${drivers[bestS1.driver].color}20`, color: drivers[bestS1.driver].color }}
                >
                  {bestS1.driver}
                </div>
              </div>
              <p className="font-racing text-3xl font-bold mb-1">{(bestS1.bestS1 / 1000).toFixed(3)}s</p>
              <p className="text-xs text-muted-foreground">{drivers[bestS1.driver].fullName}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Secteur 2</span>
                <div 
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: `${drivers[bestS2.driver].color}20`, color: drivers[bestS2.driver].color }}
                >
                  {bestS2.driver}
                </div>
              </div>
              <p className="font-racing text-3xl font-bold mb-1">{(bestS2.bestS2 / 1000).toFixed(3)}s</p>
              <p className="text-xs text-muted-foreground">{drivers[bestS2.driver].fullName}</p>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Secteur 3</span>
                <div 
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: `${drivers[bestS3.driver].color}20`, color: drivers[bestS3.driver].color }}
                >
                  {bestS3.driver}
                </div>
              </div>
              <p className="font-racing text-3xl font-bold mb-1">{(bestS3.bestS3 / 1000).toFixed(3)}s</p>
              <p className="text-xs text-muted-foreground">{drivers[bestS3.driver].fullName}</p>
            </div>
          </div>
        </div>
        
        {/* Team Summary */}
        <div className="glass-card rounded-xl p-5 opacity-0 animate-slide-up" style={{ animationDelay: '700ms' }}>
          <h2 className="font-racing text-lg font-bold mb-4">Résumé de Course</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(drivers).map(([key, driver]) => {
              const stats = driverStats.find(s => s.driver === key);
              if (!stats) return null;
              
              return (
                <div key={key} className="text-center">
                  <div 
                    className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold font-racing"
                    style={{ backgroundColor: `${driver.color}20`, color: driver.color }}
                  >
                    {driver.code}
                  </div>
                  <h3 className="font-racing font-bold mb-1">{driver.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{driver.fullName}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tours</span>
                      <span className="font-racing">{stats.laps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Best</span>
                      <span className="font-racing text-green-400">{msToTime(stats.best)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Moy</span>
                      <span className="font-racing">{msToTime(Math.round(stats.avg))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Régul.</span>
                      <span className="font-racing">{stats.consistency.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
