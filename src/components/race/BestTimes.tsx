import { Trophy, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamDetails } from '@/hooks/useTeamDetails';

interface BestTimesProps {
  details: TeamDetails | null;
}

// Convertir millisecondes en format lisible
function formatTime(ms: number): string {
  if (!ms) return '--';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3);
  return minutes > 0 ? `${minutes}:${seconds.padStart(6, '0')}` : seconds;
}

function formatSector(ms: number): string {
  if (!ms) return '--';
  return (ms / 1000).toFixed(3);
}

export function BestTimes({ details }: BestTimesProps) {
  if (!details) return null;

  const theoreticalBest = details.bestSectors.s1 + details.bestSectors.s2 + details.bestSectors.s3;

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="pb-2">
        <CardTitle className="font-racing flex items-center gap-2 text-base">
          <Trophy className="w-5 h-5 text-primary" />
          Meilleurs Temps Personnels
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Meilleur tour */}
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Meilleur Tour</span>
            </div>
            <span className="font-racing text-2xl font-bold text-primary">
              {formatTime(details.bestLap.total)}
            </span>
          </div>
        </div>

        {/* Meilleurs secteurs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <div className="text-xs text-muted-foreground mb-1">S1</div>
            <div className="font-racing text-lg font-bold text-purple-400">
              {formatSector(details.bestSectors.s1)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="text-xs text-muted-foreground mb-1">S2</div>
            <div className="font-racing text-lg font-bold text-blue-400">
              {formatSector(details.bestSectors.s2)}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <div className="text-xs text-muted-foreground mb-1">S3</div>
            <div className="font-racing text-lg font-bold text-cyan-400">
              {formatSector(details.bestSectors.s3)}
            </div>
          </div>
        </div>

        {/* Somme théorique des meilleurs secteurs */}
        <div className="flex items-center justify-between p-2 rounded bg-background/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-yellow-400" />
            Théorique (somme meilleurs secteurs)
          </div>
          <span className="font-racing font-bold text-yellow-400">
            {formatTime(theoreticalBest)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
