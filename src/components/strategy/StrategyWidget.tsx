import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Edit2, Save, X, AlertCircle, CheckCircle2, Clock, Scale, AlertTriangle, Square, Radio, Zap, Shield, Target } from 'lucide-react';
import { StrategySegment, LiveDriver, ApexLiveData } from '@/types/live';
import { StrategyTimeline } from './StrategyTimeline';
import { StrategyBuilder } from './StrategyBuilder';
import {
  validateStrategy,
  formatTime,
  calculateBallastForDriver,
} from '@/utils/strategyUtils';
import {
  analyzeTrafficState,
  isPitWindowOpen,
  TrafficAnalysis,
  getRaceEngineerAdvice,
  EngineerAdvice,
  EngineerStatus,
} from '@/utils/analysisUtils';

interface StrategyWidgetProps {
  segments: StrategySegment[];
  drivers: LiveDriver[];
  raceDurationMinutes: number;
  pitStopsRequired: number;
  pitStopMinDuration: number;
  ballastTarget: number;
  currentTimeSec?: number;
  onSave?: (segments: StrategySegment[]) => void;
  isLoading?: boolean;
  recentLapTimes?: number[];
  bestLapTime?: number;
  pitsCompleted?: number;
  liveData?: ApexLiveData | null;
  myKart?: string;
  onVirtualSC?: () => void;
}

export function StrategyWidget({
  segments,
  drivers,
  raceDurationMinutes,
  pitStopsRequired,
  pitStopMinDuration,
  ballastTarget,
  currentTimeSec = 0,
  onSave,
  isLoading,
  recentLapTimes = [],
  bestLapTime = 0,
  pitsCompleted = 0,
  liveData = null,
  myKart = '',
  onVirtualSC,
}: StrategyWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSegments, setEditedSegments] = useState<StrategySegment[]>(segments);
  const [isPitMode, setIsPitMode] = useState(false);
  const [pitCountdown, setPitCountdown] = useState(60);

  const validation = useMemo(
    () => validateStrategy(segments, raceDurationMinutes, pitStopsRequired, pitStopMinDuration),
    [segments, raceDurationMinutes, pitStopsRequired, pitStopMinDuration]
  );

  const nextSegments = useMemo(() => {
    const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);
    const nextRun = sorted.find((s) => s.type === 'RUN' && s.startSec > currentTimeSec);
    const nextPit = sorted.find((s) => s.type === 'PIT' && s.startSec > currentTimeSec);
    const currentSegment = sorted.find((s) => s.startSec <= currentTimeSec && s.endSec > currentTimeSec);
    return { nextRun, nextPit, currentSegment };
  }, [segments, currentTimeSec]);

  // Traffic analysis
  const trafficAnalysis = useMemo<TrafficAnalysis>(
    () => analyzeTrafficState(recentLapTimes, bestLapTime),
    [recentLapTimes, bestLapTime]
  );

  // Pit window status
  const pitWindowOpen = useMemo(
    () => isPitWindowOpen(currentTimeSec, raceDurationMinutes * 60, pitsCompleted, pitStopsRequired),
    [currentTimeSec, raceDurationMinutes, pitsCompleted, pitStopsRequired]
  );

  // Show undercut recommendation
  const showUndercutAlert = trafficAnalysis.status === 'TRAFFIC_DETECTED' && pitWindowOpen;

  // Engineer advice from competitor analysis
  const engineerAdvice = useMemo<EngineerAdvice>(
    () => getRaceEngineerAdvice(liveData, myKart, pitWindowOpen),
    [liveData, myKart, pitWindowOpen]
  );

  // Get status color classes
  const getStatusColors = (status: EngineerStatus) => {
    switch (status) {
      case 'GREEN':
        return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' };
      case 'ORANGE':
        return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' };
      case 'RED':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
    }
  };

  // Pit countdown timer
  useEffect(() => {
    if (!isPitMode) return;
    
    if (pitCountdown <= 0) {
      setIsPitMode(false);
      setPitCountdown(60);
      return;
    }

    const timer = setInterval(() => {
      setPitCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPitMode, pitCountdown]);

  const handleBoxNow = useCallback(() => {
    setIsPitMode(true);
    setPitCountdown(60);
  }, []);

  const handleCancelPit = useCallback(() => {
    setIsPitMode(false);
    setPitCountdown(60);
  }, []);

  const handleStartEdit = () => {
    setEditedSegments([...segments]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedSegments(segments);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave?.(editedSegments);
    setIsEditing(false);
  };

  const getDriverById = (id?: string) => drivers.find((d) => d.id === id);

  // Pit Timer Mode - Full screen countdown
  if (isPitMode) {
    return (
      <Card className="glass-card border-orange-500/50 bg-orange-950/20">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-orange-400 text-xl font-racing uppercase tracking-wider animate-pulse">
              🔧 PIT STOP EN COURS
            </div>
            <div className={`font-racing text-8xl font-bold ${
              pitCountdown <= 10 ? 'text-red-500 animate-pulse' : 
              pitCountdown <= 30 ? 'text-orange-400' : 'text-green-400'
            }`}>
              {pitCountdown}
            </div>
            <div className="text-muted-foreground text-sm">secondes restantes</div>
            <div className="w-full max-w-md h-3 bg-background/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  pitCountdown <= 10 ? 'bg-red-500' : 
                  pitCountdown <= 30 ? 'bg-orange-400' : 'bg-green-400'
                }`}
                style={{ width: `${(pitCountdown / 60) * 100}%` }}
              />
            </div>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleCancelPit}
              className="mt-4 border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
            >
              <Square className="w-4 h-4 mr-2" />
              Annuler Pit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20">
      {/* Traffic Alert Banner */}
      {showUndercutAlert && (
        <div className="px-4 py-2 bg-orange-500/20 border-b border-orange-500/30 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-racing font-semibold">CONSIDER UNDERCUT NOW</span>
              <span className="text-xs text-orange-300">
                (+{trafficAnalysis.delta.toFixed(1)}s/tour détecté)
              </span>
            </div>
            <Button 
              size="sm" 
              onClick={handleBoxNow}
              className="bg-orange-500 hover:bg-orange-600 text-white font-racing"
            >
              BOX NOW
            </Button>
          </div>
        </div>
      )}

      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-racing flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              STRATÉGIE
            </CardTitle>
            <Badge variant={validation.isValid ? 'default' : 'destructive'} className="text-[10px]">
              {validation.isValid ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> Conforme</>
              ) : (
                <><AlertCircle className="w-3 h-3 mr-1" /> {validation.errors.length} erreur(s)</>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {pitsCompleted}/{pitStopsRequired} pits
            </span>
            {/* Traffic status indicator */}
            {trafficAnalysis.status !== 'NORMAL' && (
              <Badge 
                variant="outline" 
                className={`text-[10px] ${
                  trafficAnalysis.status === 'CLEAN_AIR' 
                    ? 'border-green-500/50 text-green-400' 
                    : 'border-orange-500/50 text-orange-400'
                }`}
              >
                {trafficAnalysis.status === 'CLEAN_AIR' ? '🟢 Piste claire' : '🟠 Trafic'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Box Now button (always visible when pit window open) */}
            {pitWindowOpen && !isEditing && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleBoxNow}
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
              >
                BOX NOW
              </Button>
            )}
            {!isEditing ? (
              <Button size="sm" variant="ghost" onClick={handleStartEdit}>
                <Edit2 className="w-3 h-3 mr-1" />
                Modifier
              </Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isLoading} className="gradient-racing">
                  <Save className="w-3 h-3 mr-1" />
                  Sauvegarder
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-4">
          {isEditing ? (
            <StrategyBuilder
              drivers={drivers}
              raceDurationMinutes={raceDurationMinutes}
              pitStopsRequired={pitStopsRequired}
              pitStopMinDuration={pitStopMinDuration}
              ballastTarget={ballastTarget}
              initialSegments={editedSegments}
              onStrategyChange={setEditedSegments}
            />
          ) : (
            <div className="space-y-3">
              {/* TOP: Timeline */}
              <StrategyTimeline
                segments={segments}
                drivers={drivers}
                raceDurationMinutes={raceDurationMinutes}
                currentTimeSec={currentTimeSec}
                readOnlyBeforeSec={currentTimeSec}
              />

              {/* MIDDLE: Engineer Radio Box */}
              {myKart && (
                <div className={`rounded-lg p-3 ${getStatusColors(engineerAdvice.status).bg} ${getStatusColors(engineerAdvice.status).border} border`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getStatusColors(engineerAdvice.status).bg}`}>
                      <Radio className={`w-5 h-5 ${getStatusColors(engineerAdvice.status).text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-racing font-semibold ${getStatusColors(engineerAdvice.status).text}`}>
                          {engineerAdvice.message}
                        </span>
                        {engineerAdvice.action !== 'STAY_OUT' && (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${getStatusColors(engineerAdvice.status).border} ${getStatusColors(engineerAdvice.status).text}`}
                          >
                            {engineerAdvice.action.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{engineerAdvice.details}</p>
                      
                      {/* Competitor info */}
                      <div className="flex gap-4 mt-2 text-xs">
                        {engineerAdvice.carAhead && (
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-blue-400" />
                            <span className="text-muted-foreground">Devant:</span>
                            <span className="font-mono">#{engineerAdvice.carAhead.kart}</span>
                            <span className={engineerAdvice.carAhead.paceDelta > 0 ? 'text-green-400' : 'text-red-400'}>
                              {engineerAdvice.carAhead.paceDelta > 0 ? '+' : ''}{engineerAdvice.carAhead.paceDelta.toFixed(1)}s
                            </span>
                          </div>
                        )}
                        {engineerAdvice.carBehind && (
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-orange-400" />
                            <span className="text-muted-foreground">Derrière:</span>
                            <span className="font-mono">#{engineerAdvice.carBehind.kart}</span>
                            <span className={engineerAdvice.carBehind.paceDelta < 0 ? 'text-red-400' : 'text-green-400'}>
                              {engineerAdvice.carBehind.paceDelta > 0 ? '+' : ''}{engineerAdvice.carBehind.paceDelta.toFixed(1)}s
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTOM: Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <Button 
                  size="sm" 
                  onClick={handleBoxNow}
                  disabled={!pitWindowOpen}
                  className={`flex-1 font-racing ${
                    engineerAdvice.action === 'BOX_NOW' 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  } text-white`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  BOX NOW
                </Button>
                {onVirtualSC && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={onVirtualSC}
                    className="flex-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    🚨 VIRTUAL SC
                  </Button>
                )}
              </div>

              {/* Info rapide */}
              <div className="flex items-center justify-between text-xs">
                {/* Segment actuel */}
                <div className="flex items-center gap-4">
                  {nextSegments.currentSegment && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">En cours:</span>
                      {nextSegments.currentSegment.type === 'RUN' ? (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getDriverById(nextSegments.currentSegment.driverId)?.color }}
                          />
                          <span className="font-medium">
                            {getDriverById(nextSegments.currentSegment.driverId)?.name}
                          </span>
                          <span className="text-muted-foreground">
                            jusqu'à {formatTime(nextSegments.currentSegment.endSec)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-orange-400">PIT STOP</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Prochain relais */}
                <div className="flex items-center gap-4">
                  {nextSegments.nextPit && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <span>Prochain pit:</span>
                      <span className="font-mono">{formatTime(nextSegments.nextPit.startSec)}</span>
                      <span className="text-muted-foreground">
                        (dans {formatTime(nextSegments.nextPit.startSec - currentTimeSec)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pilotes récap */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                {drivers.map((driver) => {
                  const ballast = calculateBallastForDriver(driver.weightKg, ballastTarget);
                  const driverRuns = segments.filter((s) => s.type === 'RUN' && s.driverId === driver.id);
                  const totalTime = driverRuns.reduce((sum, s) => sum + s.durationSec, 0);

                  return (
                    <div
                      key={driver.id}
                      className="flex items-center gap-2 px-2 py-1 rounded bg-card/30 text-[10px]"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver.color }} />
                      <span className="font-medium">{driver.name}</span>
                      <span className="text-muted-foreground">{driver.weightKg}kg</span>
                      <span className="text-primary flex items-center gap-0.5">
                        <Scale className="w-2 h-2" />
                        {ballast}kg
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className="font-mono">{formatTime(totalTime)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
