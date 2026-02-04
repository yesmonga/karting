import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { SectorComparisonPoint } from '@/hooks/useLapHistory';

interface GapChartProps {
  data: SectorComparisonPoint[];
  driverAhead: string;
  driverBehind: string;
}

export function GapChart({ data, driverAhead, driverBehind }: GapChartProps) {
  const recentData = data.slice(-15);

  if (recentData.length < 2) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-racing flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-primary" />
            Comparaison Secteurs vs {driverAhead || 'Devant'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Les données apparaîtront après quelques tours...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour afficher la différence par secteur
  const chartData = recentData.map(d => ({
    lap: d.lap,
    S1: d.s1DiffAhead,
    S2: d.s2DiffAhead,
    S3: d.s3DiffAhead,
  }));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-racing flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-primary" />
          Écart Secteurs vs {driverAhead || 'Devant'}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Négatif = Tu gagnes du temps | Positif = Tu perds du temps
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="lap" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}s`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [
                  `${value > 0 ? '+' : ''}${value.toFixed(3)}s`,
                  name
                ]}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="S1"
                name="Secteur 1"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="S2"
                name="Secteur 2"
                stroke="hsl(45 93% 47%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(45 93% 47%)', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="S3"
                name="Secteur 3"
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(142.1 76.2% 36.3%)', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
