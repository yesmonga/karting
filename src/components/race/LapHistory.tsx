import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeamDetails } from '@/hooks/useTeamDetails';
import { History, Wrench } from 'lucide-react';

interface LapHistoryProps {
  details: TeamDetails | null;
  maxLaps?: number;
}

function formatSector(ms: number): string {
  if (!ms) return '--';
  return (ms / 1000).toFixed(3);
}

function formatLapTime(ms: number): string {
  if (!ms) return '--';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3);
  return `${minutes}:${seconds.padStart(6, '0')}`;
}

export function LapHistory({ details, maxLaps = 15 }: LapHistoryProps) {
  if (!details) return null;

  const laps = details.laps.slice(0, maxLaps);

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="pb-2">
        <CardTitle className="font-racing flex items-center gap-2 text-base">
          <History className="w-5 h-5 text-primary" />
          Historique des Tours
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border">
              <tr className="text-muted-foreground text-xs">
                <th className="text-left py-2 px-3">Tour</th>
                <th className="text-right py-2 px-2">S1</th>
                <th className="text-right py-2 px-2">S2</th>
                <th className="text-right py-2 px-2">S3</th>
                <th className="text-right py-2 px-3">Temps</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap) => (
                <tr 
                  key={lap.lapNumber}
                  className={`border-b border-border/30 ${lap.totalBest ? 'bg-primary/10' : ''}`}
                >
                  <td className="py-2 px-3 font-racing font-bold flex items-center gap-1">
                    {lap.lapNumber}
                    {lap.isPit && <Wrench className="w-3 h-3 text-yellow-400" />}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${lap.s1Best ? 'text-purple-400 font-bold' : ''}`}>
                    {formatSector(lap.s1)}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${lap.s2Best ? 'text-blue-400 font-bold' : ''}`}>
                    {formatSector(lap.s2)}
                  </td>
                  <td className={`py-2 px-2 text-right font-mono ${lap.s3Best ? 'text-cyan-400 font-bold' : ''}`}>
                    {formatSector(lap.s3)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono ${lap.totalBest ? 'text-green-400 font-bold' : ''}`}>
                    {formatLapTime(lap.total)}
                  </td>
                </tr>
              ))}
              {laps.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aucun tour enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
