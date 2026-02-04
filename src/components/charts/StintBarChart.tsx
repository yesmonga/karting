import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LapData, drivers, stintConfig } from '@/data/raceData';
import { getStintStats } from '@/utils/calculations';
import { msToTime } from '@/utils/timeFormat';
import { cn } from '@/lib/utils';

interface StintBarChartProps {
  laps: LapData[];
  className?: string;
}

export function StintBarChart({ laps, className }: StintBarChartProps) {
  const chartData = useMemo(() => {
    const stats = getStintStats(laps);
    
    return stats.map(s => ({
      name: `S${s.stint}`,
      stint: s.stint,
      driver: s.driver,
      avg: s.avg / 1000,
      best: s.best / 1000,
      color: drivers[s.driver]?.color || '#888',
      laps: s.laps,
    }));
  }, [laps]);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload;
    const driverInfo = drivers[data.driver];
    
    return (
      <div className="glass-card rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-racing font-bold">Stint {data.stint}</span>
          {driverInfo && (
            <span 
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${driverInfo.color}20`, color: driverInfo.color }}
            >
              {driverInfo.name}
            </span>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <p>Moyenne: <span className="font-racing">{msToTime(data.avg * 1000)}</span></p>
          <p>Best: <span className="font-racing text-green-400">{msToTime(data.best * 1000)}</span></p>
          <p className="text-xs text-muted-foreground">{data.laps} tours</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn("glass-card rounded-xl p-5", className)}>
      <h3 className="font-racing text-sm font-bold mb-4 uppercase tracking-wider">
        Temps Moyen par Stint
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <XAxis 
              type="number"
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              stroke="#666"
              fontSize={10}
              tickLine={false}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="#666"
              fontSize={10}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            
            <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/30">
        {Object.entries(drivers).map(([key, driver]) => {
          const driverStints = chartData.filter(d => d.driver === key);
          const avgOfAvgs = driverStints.length > 0 
            ? driverStints.reduce((sum, s) => sum + s.avg, 0) / driverStints.length 
            : 0;
          
          return (
            <div key={key} className="text-center">
              <div 
                className="w-6 h-6 rounded mx-auto mb-1 flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${driver.color}20`, color: driver.color }}
              >
                {driver.code}
              </div>
              <p className="font-racing text-sm">{avgOfAvgs ? msToTime(avgOfAvgs * 1000) : '--'}</p>
              <p className="text-[10px] text-muted-foreground">{driverStints.length} stints</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
