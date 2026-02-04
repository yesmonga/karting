import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Timer, BarChart3, Users, Trophy, Zap, Target, ChevronRight, Upload, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/cards/StatCard';
import { races } from '@/lib/api';
import { lapData, drivers, raceInfo, currentStatus } from '@/data/raceData';
import { getAllDriverStats, getGlobalBest, getTheoreticalBest, getValidLaps } from '@/utils/calculations';
import { msToTime } from '@/utils/timeFormat';

interface RaceStats {
  bestLapMs: number;
  bestLapNumber: number;
  position: number;
  totalKarts: number;
  totalLaps: number;
  raceName: string;
}

export default function Dashboard() {
  const [latestRace, setLatestRace] = useState<RaceStats | null>(null);
  const [hasRaces, setHasRaces] = useState(false);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestRace = async () => {
      try {
        const allRaces = await races.getAll();

        if (allRaces && allRaces.length > 0) {
          // Sort client-side since API returns all races
          // In a real app with pagination we would sort on server
          const sortedRaces = allRaces.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const race = sortedRaces[0];
          setLatestRace({
            bestLapMs: race.best_lap_ms || 0,
            bestLapNumber: race.best_lap_number || 0,
            position: race.position || 0,
            totalKarts: race.total_karts || 0,
            totalLaps: race.total_laps || 0,
            raceName: race.name,
          });
          setHasRaces(true);
        }
      } catch (error) {
        console.error('Error fetching race:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestRace();
  }, []);

  // Use real data if available, otherwise fallback to demo data
  const driverStats = getAllDriverStats(lapData);
  const globalBest = latestRace?.bestLapMs || getGlobalBest(lapData)?.total;
  const bestLapNumber = latestRace?.bestLapNumber || getGlobalBest(lapData)?.lap;
  const theoretical = getTheoreticalBest(lapData);
  const validLaps = getValidLaps(lapData);
  const position = latestRace?.position || currentStatus.position;
  const totalKarts = latestRace?.totalKarts || currentStatus.totalKarts;
  const totalLapsCount = latestRace?.totalLaps || validLaps.length;

  return (
    <div className="min-h-screen pt-20 pb-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl opacity-0 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium">
                🏎️ {latestRace?.raceName || raceInfo.raceType}
              </div>
              {hasRaces && (
                <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Données réelles
                </div>
              )}
              <div className="px-3 py-1 rounded-full bg-secondary/50 border border-border/30 text-muted-foreground text-xs">
                Kart #{raceInfo.kartNumber}
              </div>
            </div>

            <h1 className="font-racing text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Analysez vos performances{' '}
              <span className="gradient-text-racing">en temps réel</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Intelligence artificielle pour optimiser votre stratégie de course.
              Suivez les temps au tour, analysez les secteurs et améliorez vos performances.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/import">
                <Button size="lg" className="gradient-racing glow-red font-racing">
                  <Upload className="w-5 h-5 mr-2" />
                  Importer une course
                </Button>
              </Link>
              <Link to="/stints">
                <Button size="lg" variant="outline" className="font-racing border-border/50 hover:border-primary/50">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Voir les statistiques
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            title="Meilleur Tour"
            value={globalBest ? msToTime(globalBest) : '--:--.---'}
            subtitle={bestLapNumber ? `Tour ${bestLapNumber}` : ''}
            color="red"
            delay={0}
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            title="Tour Théorique"
            value={msToTime(theoretical.total)}
            subtitle="Meilleurs secteurs"
            color="purple"
            delay={100}
          />
          <StatCard
            icon={<Flag className="w-5 h-5" />}
            title="Position Finale"
            value={`P${position}`}
            subtitle={`sur ${totalKarts} karts`}
            color="amber"
            delay={200}
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            title="Tours Analysés"
            value={totalLapsCount.toString()}
            subtitle="tours valides"
            color="green"
            delay={300}
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-racing text-2xl md:text-3xl font-bold mb-3">
            Outils d'analyse
          </h2>
          <p className="text-muted-foreground">
            Tout ce dont vous avez besoin pour optimiser vos performances
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/import" className="group">
            <div className="glass-card-hover rounded-xl p-6 h-full border-2 border-primary/30">
              <div className="p-3 rounded-lg bg-primary/20 text-primary w-fit mb-4 group-hover:glow-red-subtle transition-all">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-racing text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                Import PDF
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Importez vos résultats de course au format PDF pour une analyse complète et automatisée.
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                Importer <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/live" className="group">
            <div className="glass-card-hover rounded-xl p-6 h-full">
              <div className="p-3 rounded-lg bg-amber-500/20 text-amber-400 w-fit mb-4">
                <Timer className="w-6 h-6" />
              </div>
              <h3 className="font-racing text-lg font-bold mb-2 group-hover:text-amber-400 transition-colors">
                Analyse Live
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Suivez les temps au tour en temps réel avec des graphiques dynamiques.
              </p>
              <div className="flex items-center text-amber-400 text-sm font-medium">
                Explorer <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/stints" className="group">
            <div className="glass-card-hover rounded-xl p-6 h-full">
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 w-fit mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-racing text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">
                Analyse des Stints
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comparez les performances par stint et identifiez les axes d'amélioration.
              </p>
              <div className="flex items-center text-blue-400 text-sm font-medium">
                Explorer <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link to="/team" className="group">
            <div className="glass-card-hover rounded-xl p-6 h-full">
              <div className="p-3 rounded-lg bg-green-500/20 text-green-400 w-fit mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-racing text-lg font-bold mb-2 group-hover:text-green-400 transition-colors">
                Profils Pilotes
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Consultez les statistiques détaillées de chaque pilote et leur progression.
              </p>
              <div className="flex items-center text-green-400 text-sm font-medium">
                Explorer <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Driver Quick View */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-racing text-xl font-bold">Classement Pilotes</h2>
          <Link to="/team" className="text-sm text-primary hover:underline flex items-center">
            Voir tout <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {driverStats.slice(0, 4).map((stats, index) => {
            const driver = drivers[stats.driver];
            const medals = ['🥇', '🥈', '🥉', '4️⃣'];

            return (
              <div
                key={stats.driver}
                className="glass-card-hover rounded-xl p-4 opacity-0 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold font-racing"
                    style={{ backgroundColor: `${driver.color}20`, color: driver.color }}
                  >
                    {driver.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{medals[index]}</span>
                      <h3 className="font-racing font-bold truncate">{driver.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{stats.laps} tours</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Best</p>
                    <p className="font-racing text-sm text-green-400">{msToTime(stats.best)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Régularité</p>
                    <p className="font-racing text-sm">{stats.consistency.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
