import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamDetails } from '@/hooks/useTeamDetails';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface SectorComparisonChartProps {
  myDetails: TeamDetails | null;
  aheadDetails: TeamDetails | null;
  behindDetails: TeamDetails | null;
  aheadName: string;
  behindName: string;
}

export function SectorComparisonChart({
  myDetails,
  aheadDetails,
  behindDetails,
  aheadName,
  behindName,
}: SectorComparisonChartProps) {
  const chartData = useMemo(() => {
    if (!myDetails) return [];

    const myS1 = myDetails.bestSectors.s1;
    const myS2 = myDetails.bestSectors.s2;
    const myS3 = myDetails.bestSectors.s3;

    return [
      {
        sector: 'S1',
        vsAhead: aheadDetails ? (myS1 - aheadDetails.bestSectors.s1) / 1000 : 0,
        vsBehind: behindDetails ? (myS1 - behindDetails.bestSectors.s1) / 1000 : 0,
      },
      {
        sector: 'S2',
        vsAhead: aheadDetails ? (myS2 - aheadDetails.bestSectors.s2) / 1000 : 0,
        vsBehind: behindDetails ? (myS2 - behindDetails.bestSectors.s2) / 1000 : 0,
      },
      {
        sector: 'S3',
        vsAhead: aheadDetails ? (myS3 - aheadDetails.bestSectors.s3) / 1000 : 0,
        vsBehind: behindDetails ? (myS3 - behindDetails.bestSectors.s3) / 1000 : 0,
      },
    ];
  }, [myDetails, aheadDetails, behindDetails]);

  // Calculer les totaux
  const totalVsAhead = chartData.reduce((sum, d) => sum + d.vsAhead, 0);
  const totalVsBehind = chartData.reduce((sum, d) => sum + d.vsBehind, 0);

  if (!myDetails) return null;

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="pb-2">
        <CardTitle className="font-racing flex items-center gap-2 text-base">
          <BarChart3 className="w-5 h-5 text-primary" />
          Comparaison Secteurs vs Adversaires
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Négatif = Tu gagnes du temps | Positif = Tu perds du temps
        </p>
      </CardHeader>
      <CardContent>
        {/* Résumé */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {aheadDetails && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="text-xs text-muted-foreground mb-1">vs {aheadName}</div>
              <div className={`flex items-center gap-1 font-racing font-bold ${
                totalVsAhead < 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {totalVsAhead < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {totalVsAhead > 0 ? '+' : ''}{totalVsAhead.toFixed(3)}s
              </div>
            </div>
          )}
          {behindDetails && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="text-xs text-muted-foreground mb-1">vs {behindName}</div>
              <div className={`flex items-center gap-1 font-racing font-bold ${
                totalVsBehind < 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {totalVsBehind < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {totalVsBehind > 0 ? '+' : ''}{totalVsBehind.toFixed(3)}s
              </div>
            </div>
          )}
        </div>

        {/* Graphique */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                type="number" 
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}s`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
              />
              <YAxis 
                type="category" 
                dataKey="sector" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(3)}s`, '']}
              />
              <Legend />
              <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              
              {aheadDetails && (
                <Bar dataKey="vsAhead" name={`vs ${aheadName}`} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`ahead-${index}`} fill={entry.vsAhead < 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} />
                  ))}
                </Bar>
              )}
              
              {behindDetails && (
                <Bar dataKey="vsBehind" name={`vs ${behindName}`} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`behind-${index}`} fill={entry.vsBehind < 0 ? 'hsl(142, 76%, 50%)' : 'hsl(0, 84%, 70%)'} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Détails par secteur */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
          {chartData.map((data) => (
            <div key={data.sector} className="p-2 rounded bg-background/30 text-center">
              <div className="font-bold mb-1">{data.sector}</div>
              {aheadDetails && (
                <div className={data.vsAhead < 0 ? 'text-green-400' : 'text-red-400'}>
                  {data.vsAhead > 0 ? '+' : ''}{data.vsAhead.toFixed(3)}s
                </div>
              )}
              {behindDetails && (
                <div className={`${data.vsBehind < 0 ? 'text-green-400' : 'text-red-400'} opacity-70`}>
                  {data.vsBehind > 0 ? '+' : ''}{data.vsBehind.toFixed(3)}s
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
