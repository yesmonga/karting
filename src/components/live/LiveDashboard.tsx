import { useState, useMemo } from 'react';
import { ApexLiveData, ApexDriverData, LiveRaceConfig, LiveStint, StrategySegment } from '@/types/live';
import { ActionHistory } from '@/hooks/useActionHistory';
import { calculateRealSectors } from '@/utils/raceUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, Timer, Gauge, Flag, Users, AlertTriangle,
  Clock, Car, Scale
} from 'lucide-react';
import { calculateBallast, formatBallast } from '@/utils/ballastCalculator';
import { useRaceTimer } from '@/hooks/useRaceTimer';
import { usePitTracker } from '@/hooks/usePitTracker';
import { useLapHistory, getBestSectors } from '@/hooks/useLapHistory';
import { useAIAdvisor } from '@/hooks/useAIAdvisor';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import { useLayoutCustomizer, SectionId } from '@/hooks/useLayoutCustomizer';
import { GapChart } from './GapChart';
import { AIAdvisorPanel } from './AIAdvisorPanel';
import { SectorAnalysis } from './SectorAnalysis';
import { PitWindowIndicator } from './PitWindowIndicator';
import { LayoutCustomizer } from './LayoutCustomizer';
import { QRCodeShare } from './QRCodeShare';
import { MiniTrackMap } from './MiniTrackMap';
import { BestTimes } from '@/components/race/BestTimes';
import { SectorComparisonChart } from '@/components/race/SectorComparisonChart';
import { LapHistory } from '@/components/race/LapHistory';
import { CommentsPanel } from '@/components/race/CommentsPanel';
import { MessageSender } from '@/components/race/MessageSender';
import { StrategyWidget } from '@/components/strategy/StrategyWidget';

interface LiveDashboardProps {
  config: LiveRaceConfig;
  selectedKart: string;
  selectedTeam: string;
  liveData: ApexLiveData | null;
  isConnected: boolean;
  stints: LiveStint[];
  onStintUpdate: (stints: LiveStint[]) => void;
  raceStartTime: number | null;
  circuitId: string;
  sessionId: string | null;
  strategySegments?: StrategySegment[];
  onStrategyUpdate?: (segments: StrategySegment[]) => void;
}

export function LiveDashboard({
  config,
  selectedKart,
  selectedTeam,
  liveData,
  isConnected,
  stints,
  onStintUpdate,
  raceStartTime,
  circuitId,
  sessionId,
  strategySegments = [],
  onStrategyUpdate,
}: LiveDashboardProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Layout customization
  const layoutCustomizer = useLayoutCustomizer();

  // Real-time race timer - use Apex timing data
  const apexRemainingMs = liveData?.raceTimeRemaining || 0;
  const lastUpdateTime = liveData?.timestamp ? new Date(liveData.timestamp).getTime() : (raceStartTime || Date.now());
  const raceTimer = useRaceTimer(apexRemainingMs, config.raceDurationMinutes, lastUpdateTime);

  // Get my team data
  const myTeam = useMemo(() => {
    return liveData?.drivers.find(d => d.kart === selectedKart) || null;
  }, [liveData, selectedKart]);

  // Driver ahead/behind for gap chart and comparison
  const myIndex = liveData?.drivers.findIndex(d => d.kart === selectedKart) ?? -1;
  const driverAhead = myIndex > 0 ? liveData?.drivers[myIndex - 1] : null;
  const driverBehind = myIndex >= 0 && myIndex < (liveData?.drivers.length || 0) - 1
    ? liveData?.drivers[myIndex + 1]
    : null;

  // Fetch detailed team data from API
  const { details: myDetails, loading: myLoading } = useTeamDetails(
    circuitId,
    myTeam?.driverId || null,
    5000
  );

  const { details: aheadDetails } = useTeamDetails(
    circuitId,
    driverAhead?.driverId || null,
    5000
  );

  const { details: behindDetails } = useTeamDetails(
    circuitId,
    driverBehind?.driverId || null,
    5000
  );

  // Lap history and gap data for charts
  const { lapHistory, gapData, sectorComparison } = useLapHistory(liveData?.drivers || [], selectedKart);

  // Best sectors from lap history
  const bestSectors = useMemo(() => getBestSectors(lapHistory), [lapHistory]);

  // Pit tracker - automatic detection
  const myPitsCount = parseInt(myTeam?.pits || '0');
  const myLapsCount = parseInt(myTeam?.laps || '0');
  const myPosition = parseInt(myTeam?.position || '0');
  const pitTracker = usePitTracker(myPitsCount, myLapsCount, myPosition);

  // AI Advisor with pit window analysis
  const { advices: aiAdvices, pitWindow } = useAIAdvisor(
    liveData?.drivers || [],
    selectedKart,
    lapHistory,
    raceTimer.remaining,
    config.pitStopsRequired,
    pitTracker.totalPits,
    30000 // 30 seconds interval
  );

  // Pits remaining
  const pitsRemaining = config.pitStopsRequired - pitTracker.totalPits;

  // Active stint driver
  const activeStint = stints.find(s => s.isActive);
  const activeDriver = activeStint ? config.drivers.find(d => d.id === activeStint.driverId) : null;

  const assignDriverToStint = (stintId: string, driverId: string) => {
    const driver = config.drivers.find(d => d.id === driverId);
    const updated = stints.map(s =>
      s.id === stintId
        ? { ...s, driverId, driverName: driver?.name || null }
        : s
    );
    onStintUpdate(updated);
  };

  const setActiveStint = (stintId: string) => {
    const updated = stints.map(s => ({
      ...s,
      isActive: s.id === stintId,
    }));
    onStintUpdate(updated);
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header Status Bar with Real-time Timer */}
        <div className="glass-card rounded-xl p-4 animate-slide-up">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LayoutCustomizer
                sections={layoutCustomizer.sections}
                onMoveSection={layoutCustomizer.moveSection}
                onToggleVisibility={layoutCustomizer.toggleVisibility}
                onReset={layoutCustomizer.resetLayout}
                isOpen={layoutCustomizer.isCustomizing}
                onOpenChange={layoutCustomizer.setIsCustomizing}
              />
              {sessionId && (
                <QRCodeShare
                  sessionId={sessionId}
                  teamName={selectedTeam}
                  kartNumber={selectedKart}
                />
              )}
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <div className="font-racing font-bold text-lg">{config.raceName}</div>
                <div className="text-sm text-muted-foreground">{liveData?.circuit || 'Connexion...'}</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-muted-foreground flex items-center gap-1 justify-center">
                  <Clock className="w-3 h-3" />
                  Restant
                </div>
                <div className={`font-racing font-bold text-lg ${raceTimer.remaining < 600 ? 'text-destructive animate-pulse' : 'text-primary'
                  }`}>
                  {raceTimer.formattedRemaining}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-background/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000"
              style={{ width: `${raceTimer.percent}%` }}
            />
          </div>
        </div>

        {/* Strategy Widget - Sticky at top */}
        {strategySegments.length > 0 && (
          <StrategyWidget
            segments={strategySegments}
            drivers={config.drivers}
            raceDurationMinutes={config.raceDurationMinutes}
            pitStopsRequired={config.pitStopsRequired}
            pitStopMinDuration={config.pitStopMinDuration}
            ballastTarget={config.ballastTarget}
            currentTimeSec={Math.floor((config.raceDurationMinutes * 60) - (raceTimer.remaining / 1000))}
            onSave={onStrategyUpdate}
          />
        )}

        {/* Main Info Row */}
        <div className="glass-card rounded-xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tour Actuel</div>
              <div className="font-racing text-2xl font-bold text-primary">
                {myDetails?.currentLap || myTeam?.laps || '0'}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">En Piste</div>
              <div className="font-racing text-lg font-bold text-green-400 truncate">
                {myDetails?.currentDriver?.name || activeDriver?.name || selectedTeam}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Kart</div>
              <div className="font-racing text-2xl font-bold">
                #{selectedKart}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Position</div>
              <div className="font-racing text-2xl font-bold">
                P{myTeam?.position || '--'}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Meilleur Tour</div>
              <div className="font-racing text-xl font-bold text-green-400">
                {myTeam?.bestLap || '--'}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Arrêts</div>
              <div className="font-racing text-2xl font-bold">
                {pitTracker.totalPits}
                <span className="text-sm text-muted-foreground">/{config.pitStopsRequired}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - My Team Info */}
          <div className="lg:col-span-2 space-y-6">
            {layoutCustomizer.getSectionOrder().map((sectionId) => {
              switch (sectionId) {
                case 'ai-advisor':
                  return <AIAdvisorPanel key={sectionId} advices={aiAdvices} />;
                case 'track-map':
                  return liveData?.drivers && liveData.drivers.length > 0 ? (
                    <Card key={sectionId} className="glass-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-racing flex items-center gap-2 text-sm">
                          <Car className="w-4 h-4 text-primary" />
                          Live Tracking
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <MiniTrackMap
                          drivers={liveData.drivers}
                          selectedKart={selectedKart}
                          circuitId={circuitId}
                          showLabels={true}
                        />
                      </CardContent>
                    </Card>
                  ) : null;
                case 'sector-analysis':
                  const { s1, s2, s3 } = calculateRealSectors(
                    myTeam?.s1 || '',
                    myTeam?.s2 || '',
                    myTeam?.s3 || ''
                  );
                  return (
                    <SectorAnalysis
                      key={sectionId}
                      currentS1={s1}
                      currentS2={s2}
                      currentS3={s3}
                      bestS1={myDetails?.bestSectors.s1 || bestSectors?.s1 || 0}
                      bestS2={myDetails?.bestSectors.s2 || bestSectors?.s2 || 0}
                      bestS3={myDetails?.bestSectors.s3 || bestSectors?.s3 || 0}
                    />
                  );
                case 'best-times':
                  return <BestTimes key={sectionId} details={myDetails} />;
                case 'sector-comparison':
                  return (
                    <SectorComparisonChart
                      key={sectionId}
                      myDetails={myDetails}
                      aheadDetails={aheadDetails}
                      behindDetails={behindDetails}
                      aheadName={driverAhead?.team || 'Devant'}
                      behindName={driverBehind?.team || 'Derrière'}
                    />
                  );
                case 'gap-chart':
                  return (
                    <GapChart
                      key={sectionId}
                      data={sectorComparison}
                      driverAhead={driverAhead?.team || 'Devant'}
                      driverBehind={driverBehind?.team || 'Derrière'}
                    />
                  );
                case 'pit-window':
                  return <PitWindowIndicator key={sectionId} pitWindow={pitWindow} pitsRemaining={pitsRemaining} />;
                case 'standings':
                  return (
                    <Card key={sectionId} className="glass-card animate-slide-up" style={{ animationDelay: '200ms' }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="font-racing flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-primary" />
                          Classement Live
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
                              <tr className="border-b border-border text-muted-foreground">
                                <th className="text-left py-2 px-1">Pos</th>
                                <th className="text-left py-2 px-1">Kart</th>
                                <th className="text-left py-2 px-1">Équipe</th>
                                <th className="text-right py-2 px-1">Dernier</th>
                                <th className="text-right py-2 px-1">Écart</th>
                                <th className="text-right py-2 px-1">Tours</th>
                                <th className="text-right py-2 px-1">Pits</th>
                              </tr>
                            </thead>
                            <tbody>
                              {liveData?.drivers.map((driver) => {
                                const isMe = driver.kart === selectedKart;
                                return (
                                  <tr
                                    key={driver.kart}
                                    className={`border-b border-border/30 ${isMe ? 'bg-primary/10' : ''}`}
                                  >
                                    <td className="py-2 px-1 font-racing font-bold">{driver.position}</td>
                                    <td className="py-2 px-1">{driver.kart}</td>
                                    <td className="py-2 px-1 truncate max-w-[150px]">
                                      {isMe && <span className="text-primary mr-1">►</span>}
                                      {driver.team}
                                    </td>
                                    <td className="py-2 px-1 text-right font-mono">{driver.lastLap || '--'}</td>
                                    <td className="py-2 px-1 text-right font-mono">{driver.gap || '--'}</td>
                                    <td className="py-2 px-1 text-right">{driver.laps}</td>
                                    <td className="py-2 px-1 text-right">{driver.pits}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Right Column - Drivers & Stints */}
          <div className="space-y-6">
            {/* Lap History - NEW */}
            <LapHistory details={myDetails} maxLaps={15} />

            {/* Active Driver */}
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '150ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="font-racing flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  Pilote Actif
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeDriver ? (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-background/30 border-2 border-primary/50">
                    <div
                      className="w-4 h-12 rounded-full"
                      style={{ backgroundColor: activeDriver.color }}
                    />
                    <div className="flex-1">
                      <div className="font-racing font-bold text-xl">{activeDriver.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {activeDriver.weightKg}kg • {formatBallast(calculateBallast(activeDriver.weightKg, config.ballastTarget))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Sélectionnez un pilote pour le stint
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Sender for Onboard */}
            {selectedKart && (
              <MessageSender kartNumber={selectedKart} sessionId={sessionId || undefined} />
            )}
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="font-racing flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Pilotes ({config.drivers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {config.drivers.map((driver) => {
                    const ballast = calculateBallast(driver.weightKg, config.ballastTarget);
                    const isActive = activeDriver?.id === driver.id;

                    return (
                      <button
                        key={driver.id}
                        onClick={() => {
                          if (activeStint) {
                            assignDriverToStint(activeStint.id, driver.id);
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${isActive
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-background/30 border border-border/50 hover:border-primary/30'
                          }`}
                      >
                        <div
                          className="w-3 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: driver.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-racing font-semibold">{driver.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {driver.weightKg}kg • {formatBallast(ballast)}
                          </div>
                        </div>
                        <Scale className="w-4 h-4 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stints */}
            <Card className="glass-card animate-slide-up" style={{ animationDelay: '250ms' }}>
              <CardHeader className="pb-2">
                <CardTitle className="font-racing flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  Stints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stints.map((stint) => {
                    const driver = stint.driverId ? config.drivers.find(d => d.id === stint.driverId) : null;

                    return (
                      <button
                        key={stint.id}
                        onClick={() => setActiveStint(stint.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${stint.isActive
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-background/30 border border-border/50 hover:border-primary/30'
                          }`}
                      >
                        <div className="font-racing font-bold text-lg w-8">
                          {stint.stintNumber}
                        </div>
                        {driver ? (
                          <>
                            <div
                              className="w-2 h-6 rounded-full shrink-0"
                              style={{ backgroundColor: driver.color }}
                            />
                            <span className="font-semibold">{driver.name}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Non assigné</span>
                        )}
                        {stint.isActive && (
                          <Badge className="ml-auto" variant="default">Actif</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Comments - Using new CommentsPanel */}
            <CommentsPanel
              comments={liveData?.comments || []}
              maxHeight={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
