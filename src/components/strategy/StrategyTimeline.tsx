import { useRef, useMemo } from 'react';
import { StrategySegment, LiveDriver } from '@/types/live';
import { formatTime } from '@/utils/strategyUtils';

interface StrategyTimelineProps {
  segments: StrategySegment[];
  drivers: LiveDriver[];
  raceDurationMinutes: number;
  currentTimeSec?: number;
  onSegmentClick?: (segment: StrategySegment) => void;
  selectedSegmentId?: string;
  readOnlyBeforeSec?: number;
}

export function StrategyTimeline({
  segments,
  drivers,
  raceDurationMinutes,
  currentTimeSec,
  onSegmentClick,
  selectedSegmentId,
  readOnlyBeforeSec = 0,
}: StrategyTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalRaceSec = raceDurationMinutes * 60;

  const driverMap = useMemo(() => {
    const map = new Map<string, LiveDriver>();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  const sortedSegments = useMemo(
    () => [...segments].sort((a, b) => a.startSec - b.startSec),
    [segments]
  );

  const timeMarkers = useMemo(() => {
    const markers: number[] = [];
    const interval = totalRaceSec <= 3600 ? 600 : 1800;
    for (let t = 0; t <= totalRaceSec; t += interval) {
      markers.push(t);
    }
    if (markers[markers.length - 1] !== totalRaceSec) {
      markers.push(totalRaceSec);
    }
    return markers;
  }, [totalRaceSec]);

  return (
    <div className="w-full">
      {/* Timeline container */}
      <div ref={containerRef} className="relative w-full h-16 bg-card/30 rounded-lg overflow-hidden">
        {/* Segments */}
        {sortedSegments.map((segment) => {
          const left = (segment.startSec / totalRaceSec) * 100;
          const width = (segment.durationSec / totalRaceSec) * 100;
          const driver = segment.driverId ? driverMap.get(segment.driverId) : null;
          const isSelected = selectedSegmentId === segment.id;
          const isReadOnly = segment.endSec <= readOnlyBeforeSec;
          const isPit = segment.type === 'PIT';

          return (
            <div
              key={segment.id}
              className={`absolute top-1 bottom-1 flex items-center justify-center cursor-pointer transition-all ${
                isPit
                  ? 'bg-gray-600/80 border border-gray-500'
                  : 'border border-white/20'
              } ${isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-black' : ''} ${
                isReadOnly ? 'opacity-60' : ''
              }`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: isPit ? undefined : driver?.color || '#666',
                minWidth: '2px',
              }}
              onClick={() => onSegmentClick?.(segment)}
              title={`${segment.type}: ${formatTime(segment.startSec)} → ${formatTime(segment.endSec)}`}
            >
              {/* Label si assez large */}
              {width > 8 && (
                <div className="text-[10px] font-mono text-white truncate px-1 text-center leading-tight">
                  {isPit ? (
                    <span className="text-gray-300">PIT</span>
                  ) : (
                    <>
                      <div className="font-bold truncate">{driver?.name || '?'}</div>
                      <div className="opacity-70">
                        {formatTime(segment.startSec)}→{formatTime(segment.endSec)}
                      </div>
                    </>
                  )}
                </div>
              )}
              {width <= 8 && width > 3 && isPit && (
                <div className="text-[8px] text-gray-300">P</div>
              )}
            </div>
          );
        })}

        {/* Now marker */}
        {currentTimeSec !== undefined && currentTimeSec > 0 && currentTimeSec < totalRaceSec && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
            style={{ left: `${(currentTimeSec / totalRaceSec) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-400" />
          </div>
        )}
      </div>

      {/* Time axis */}
      <div className="relative w-full h-5 mt-1">
        {timeMarkers.map((t) => {
          const left = (t / totalRaceSec) * 100;
          return (
            <div
              key={t}
              className="absolute text-[9px] text-muted-foreground font-mono"
              style={{
                left: `${left}%`,
                transform: t === totalRaceSec ? 'translateX(-100%)' : t === 0 ? 'none' : 'translateX(-50%)',
              }}
            >
              {formatTime(t)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
