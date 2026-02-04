import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LapData, drivers } from '@/data/raceData';
import { getDriverForLap, getValidLaps } from '@/utils/calculations';
import { msToTime } from '@/utils/timeFormat';
import { cn } from '@/lib/utils';

interface LapTimeChartProps {
  laps: LapData[];
  showAverage?: boolean;
  highlightBest?: boolean;
  className?: string;
}

export function LapTimeChart({ laps, showAverage = true, highlightBest = true, className }: LapTimeChartProps) {
  const chartData = useMemo(() => {
    const validLaps = getValidLaps(laps);
    const sortedLaps = [...validLaps].sort((a, b) => a.lap - b.lap).slice(-30);
    
    return sortedLaps.map(lap => {
      const driver = getDriverForLap(lap.lap);
      const driverInfo = driver ? drivers[driver] : null;
      
      return {
        lap: lap.lap,
        time: lap.total / 1000,
        driver,
        color: driverInfo?.color || '#888888',
        s1: lap.s1 / 1000,
        s2: lap.s2 / 1000,
        s3: lap.s3 / 1000,
      };
    });
  }, [laps]);
  
  const avgTime = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.time, 0) / chartData.length;
  }, [chartData]);
  
  const bestTime = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.min(...chartData.map(d => d.time));
  }, [chartData]);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload;
    const driverInfo = data.driver ? drivers[data.driver] : null;
    
    return (
      <div className="glass-card rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-racing font-bold">Tour {data.lap}</span>
          {driverInfo && (
            <span 
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ backgroundColor: `${driverInfo.color}20`, color: driverInfo.color }}
            >
              {driverInfo.code}
            </span>
          )}
        </div>
        <p className="font-racing text-lg">{msToTime(data.time * 1000)}</p>
        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
          <span>S1: {data.s1.toFixed(3)}</span>
          <span>S2: {data.s2.toFixed(3)}</span>
          <span>S3: {data.s3.toFixed(3)}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn("glass-card rounded-xl p-5", className)}>
      <h3 className="font-racing text-sm font-bold mb-4 uppercase tracking-wider">
        Temps au Tour (30 derniers)
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis 
              dataKey="lap" 
              stroke="#666"
              fontSize={10}
              tickLine={false}
            />
            <YAxis 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              stroke="#666"
              fontSize={10}
              tickLine={false}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {showAverage && (
              <ReferenceLine 
                y={avgTime} 
                stroke="#666" 
                strokeDasharray="3 3"
                label={{ value: 'Moy', position: 'right', fill: '#666', fontSize: 10 }}
              />
            )}
            
            {highlightBest && (
              <ReferenceLine 
                y={bestTime} 
                stroke="#10B981" 
                strokeDasharray="3 3"
                label={{ value: 'Best', position: 'right', fill: '#10B981', fontSize: 10 }}
              />
            )}
            
            <Line 
              type="monotone" 
              dataKey="time" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={payload.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/30">
        {Object.entries(drivers).map(([key, driver]) => (
          <div key={key} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: driver.color }}
            />
            <span className="text-xs text-muted-foreground">{driver.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
