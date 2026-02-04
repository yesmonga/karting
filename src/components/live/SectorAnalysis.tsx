import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Gauge } from 'lucide-react';
import { parseTime } from '@/utils/raceUtils';

interface SectorAnalysisProps {
  currentS1: string;
  currentS2: string;
  currentS3: string;
  bestS1: number;  // En millisecondes depuis l'API
  bestS2: number;
  bestS3: number;
}

export function SectorAnalysis({
  currentS1, currentS2, currentS3,
  bestS1, bestS2, bestS3,
}: SectorAnalysisProps) {
  // Convertir les meilleurs secteurs de ms en secondes
  const bestS1Sec = bestS1 > 0 ? bestS1 / 1000 : 0;
  const bestS2Sec = bestS2 > 0 ? bestS2 / 1000 : 0;
  const bestS3Sec = bestS3 > 0 ? bestS3 / 1000 : 0;

  const sectors = [
    { name: 'S1', current: currentS1, myBest: bestS1Sec, color: 'purple' },
    { name: 'S2', current: currentS2, myBest: bestS2Sec, color: 'blue' },
    { name: 'S3', current: currentS3, myBest: bestS3Sec, color: 'cyan' },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-racing flex items-center gap-2 text-base">
          <Gauge className="w-5 h-5 text-primary" />
          Analyse Secteurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {sectors.map((sector) => {
            const cleanValue = sector.current?.replace(/[🟣🟢]/gu, '').trim() || '';
            const currentTime = parseTime(sector.current);
            const isPurple = sector.current?.includes('🟣');
            const isGreen = sector.current?.includes('🟢');
            const diffToBest = sector.myBest > 0 && currentTime > 0 ? currentTime - sector.myBest : null;

            return (
              <div
                key={sector.name}
                className={`text-center p-3 rounded-lg border transition-colors ${isPurple ? 'border-purple-500 bg-purple-500/10' :
                  isGreen ? 'border-green-500 bg-green-500/10' :
                    'border-border bg-background/30'
                  }`}
              >
                <div className="text-xs text-muted-foreground mb-1">{sector.name}</div>
                <div className={`font-racing text-lg font-bold ${isPurple ? 'text-purple-400' : isGreen ? 'text-green-400' : ''
                  }`}>
                  {cleanValue || '--'}
                </div>

                {diffToBest !== null && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {diffToBest < -0.05 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : diffToBest > 0.1 ? (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    ) : (
                      <Minus className="w-3 h-3 text-yellow-400" />
                    )}
                    <span className={`text-xs font-medium ${diffToBest < -0.05 ? 'text-green-400' :
                      diffToBest > 0.1 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                      {diffToBest > 0 ? '+' : ''}{diffToBest.toFixed(2)}s
                    </span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-1">
                  Best: {sector.myBest > 0 ? sector.myBest.toFixed(3) : '--'}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}