import { Flag, User, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TeamDetails } from '@/hooks/useTeamDetails';
import { Skeleton } from '@/components/ui/skeleton';

interface CurrentLapDriverProps {
  details: TeamDetails | null;
  loading?: boolean;
}

export function CurrentLapDriver({ details, loading }: CurrentLapDriverProps) {
  if (loading && !details) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <Skeleton className="h-16 w-24" />
            <Skeleton className="h-16 w-32" />
            <Skeleton className="h-16 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!details) return null;

  return (
    <Card className="glass-card animate-slide-up">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Tour actuel */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <Flag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Tour actuel</div>
              <div className="font-racing text-3xl font-bold text-primary">
                {details.currentLap}
              </div>
            </div>
          </div>

          {/* Pilote en piste */}
          {details.currentDriver && (
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <div className="p-3 rounded-lg bg-green-500/20">
                <User className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">En piste</div>
                <div className="font-racing text-xl font-bold text-green-400">
                  {details.currentDriver.name}
                </div>
              </div>
            </div>
          )}

          {/* Kart */}
          <div className="flex items-center gap-3 pl-6 border-l border-border">
            <div className="p-3 rounded-lg bg-secondary/50">
              <Car className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Kart</div>
              <div className="font-racing text-xl font-bold">
                #{details.kartNumber}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
