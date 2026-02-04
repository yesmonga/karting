import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { liveSessions, apex } from '@/lib/api';
import { ApexLiveData, LiveRaceConfig, LiveStint, ApexDriverData } from '@/types/live';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QRCodeSVG } from 'qrcode.react';
import {
  Trophy, Clock, Car, Flag, Timer, Gauge, Users,
  ChevronDown, ChevronUp, Share2, Maximize2, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

interface SessionData {
  config: LiveRaceConfig;
  selected_kart: string;
  selected_team: string;
  circuit_id: string;
  stints: LiveStint[];
}

// Helper component for standings list
const StandingsList = ({ drivers, myKart }: { drivers: ApexDriverData[]; myKart: string }) => (
  <div className="divide-y divide-border/30">
    {drivers.map((driver) => {
      const isUs = driver.kart === myKart;
      return (
        <div
          key={driver.kart}
          className={`flex items-center justify-between p-3 text-sm transition-colors ${isUs ? 'bg-primary/20 hover:bg-primary/25' : 'hover:bg-white/5'
            }`}
        >
          <div className="flex items-center gap-3">
            <span className={`font-racing font-bold w-8 text-center ${isUs ? 'text-primary' : 'text-muted-foreground'
              }`}>
              P{driver.position}
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">#{driver.kart}</span>
                <span className={`font-medium truncate max-w-[120px] ${isUs ? 'text-primary' : ''}`}>
                  {driver.team}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="font-mono text-xs">{driver.bestLap}</span>
            <span className="text-[10px] text-muted-foreground">{driver.gap || '-'}</span>
          </div>
        </div>
      );
    })}
  </div>
);

export default function Spectator() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [liveData, setLiveData] = useState<ApexLiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullStandings, setShowFullStandings] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch session from database (public access)
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('Session introuvable');
        setLoading(false);
        return;
      }

      try {
        const data = await liveSessions.getById(sessionId);

        if (!data) {
          setError('Session introuvable ou expirée');
          setLoading(false);
          return;
        }

        setSession({
          config: data.config as unknown as LiveRaceConfig,
          selected_kart: data.selected_kart,
          selected_team: data.selected_team,
          circuit_id: data.circuit_id,
          stints: (data.stints as unknown as LiveStint[]) || [],
        });
        setLoading(false);
      } catch {
        setError('Session introuvable ou expirée');
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Fetch live data from Apex
  const fetchApexData = useCallback(async (circuitId: string): Promise<ApexLiveData | null> => {
    try {
      const data = await apex.getLiveData(circuitId);
      return data as ApexLiveData;
    } catch (err) {
      console.error('Fetch error:', err);
      return null;
    }
  }, []);

  // Start polling when session is loaded
  useEffect(() => {
    if (session) {
      const poll = async () => {
        const data = await fetchApexData(session.circuit_id);
        if (data) {
          setLiveData(data);
        }
      };

      poll();
      pollingRef.current = setInterval(poll, 5000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [session, fetchApexData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Share URL
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    if (!ms || ms <= 0) return '--:--:--';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Session non trouvée</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get tracked team data
  const myTeam = liveData?.drivers.find(d => d.kart === session.selected_kart);
  const myPosition = myTeam ? parseInt(myTeam.position) : null;
  const isConnected = liveData?.status === 'CONNECTED' || (liveData?.drivers?.length ?? 0) > 0;
  const allDrivers = liveData?.drivers || [];

  // Get nearby karts (2 ahead, 2 behind)
  const getNearbyKarts = (): ApexDriverData[] => {
    if (!myPosition || !allDrivers.length) return [];

    const nearby: ApexDriverData[] = [];

    // 2 positions ahead
    for (let i = myPosition - 2; i < myPosition; i++) {
      const driver = allDrivers.find(d => parseInt(d.position) === i);
      if (driver) nearby.push(driver);
    }

    // Our kart
    if (myTeam) nearby.push(myTeam);

    // 2 positions behind
    for (let i = myPosition + 1; i <= myPosition + 2; i++) {
      const driver = allDrivers.find(d => parseInt(d.position) === i);
      if (driver) nearby.push(driver);
    }

    return nearby;
  };

  const nearbyKarts = getNearbyKarts();

  // Get active stint
  const activeStint = session.stints.find(s => s.isActive);

  // Position trend (comparing with previous position if available)
  const getPositionTrend = () => {
    // Could be enhanced with history tracking
    return null; // Return: 'up', 'down', or null
  };

  return (
    <div ref={containerRef} className={`min-h-screen bg-background p-4 ${isFullscreen ? 'p-8' : ''}`}>
      <div className={`mx-auto ${isFullscreen ? 'container' : 'max-w-7xl'}`}>

        {/* PC Layout: Grid system */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: Race Info & Status (lg: col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header / Race Status */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h1 className="font-racing font-bold text-xl truncate" title={session.config.raceName}>
                      {session.config.raceName}
                    </h1>
                    <div className={`w-3 h-3 flex-shrink-0 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{liveData?.circuit || session.circuit_id}</p>

                  {/* Time Remaining */}
                  {liveData?.raceTimeRemaining && liveData.raceTimeRemaining > 0 && (
                    <div className="mt-2 pt-2 border-t border-primary/20">
                      <p className="text-xs text-muted-foreground uppercase">Temps restant</p>
                      <p className="font-racing font-bold text-primary text-2xl">
                        {formatTimeRemaining(liveData.raceTimeRemaining)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* QR Code (Visible on PC side) */}
            <Card className="hidden lg:block">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="p-2 bg-white rounded-lg mb-3">
                  <QRCodeSVG value={shareUrl} size={120} />
                </div>
                <p className="text-sm font-medium">Scannez pour suivre</p>
                <p className="text-xs text-muted-foreground mt-1">Version Mobile Optimisée</p>
              </CardContent>
            </Card>

            {/* Controls (PC) */}
            <Card className="hidden lg:block">
              <CardContent className="p-4">
                <Button variant="outline" className="w-full" onClick={toggleFullscreen}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  {isFullscreen ? 'Quitter Plein écran' : 'Mode Plein écran'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* MIDDLE COLUMN: Main Kart Stats (lg: col-span-5) */}
          <div className="lg:col-span-5 space-y-4">

            {/* Main Team Card */}
            <Card className="border-2 border-primary/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Car className="w-32 h-32" />
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Car className="h-5 w-5" />
                      <span className="font-bold">Kart #{session.selected_kart}</span>
                    </div>
                    <h2 className="font-racing font-bold text-3xl md:text-4xl text-foreground">
                      {session.selected_team}
                    </h2>
                    {activeStint?.driverName && (
                      <Badge variant="secondary" className="mt-2 font-racing text-sm py-1 px-3">
                        <Users className="h-3 w-3 mr-1" />
                        {activeStint.driverName}
                      </Badge>
                    )}
                  </div>

                  <div className="text-right z-10">
                    <div className="font-racing font-bold text-5xl md:text-7xl leading-none">
                      P{myTeam?.position || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      /{allDrivers.length || '--'}
                    </div>
                  </div>
                </div>

                {/* Gap & Interval Row */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase mb-1">Écart Leader</div>
                    <div className={`font-racing text-2xl ${myTeam?.gap ? 'text-red-400' : ''}`}>
                      {myTeam?.gap || '--'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase mb-1">Intervalle</div>
                    <div className="font-racing text-2xl">
                      {myTeam?.interval || '--'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Tours</div>
                  <div className="font-racing font-bold text-2xl">{myTeam?.laps || '--'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Best</div>
                  <div className="font-racing font-bold text-2xl text-green-500">{myTeam?.bestLap || '--'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Last</div>
                  <div className="font-racing font-bold text-2xl text-blue-400">{myTeam?.lastLap || '--'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1">Arrêts</div>
                  <div className="font-racing font-bold text-2xl text-amber-500">
                    {myTeam?.pits || '0'}<span className="text-sm text-muted-foreground">/{session.config.pitStopsRequired}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nearby Karts */}
            {nearbyKarts.length > 0 && (
              <Card>
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm flex items-center gap-2 uppercase tracking-wide">
                    <Trophy className="h-4 w-4 text-primary" />
                    Karts Proches
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {nearbyKarts.map((driver, idx) => {
                    const isUs = driver.kart === session.selected_kart;
                    return (
                      <div
                        key={driver.kart}
                        className={`flex items-center justify-between p-3 border-b last:border-0 border-border/40 ${isUs ? 'bg-primary/10' : ''} hover:bg-white/5 transition-colors`}
                      >
                        <div className="flex items-center gap-4">
                          <span className={`font-racing font-bold w-8 text-center ${isUs ? 'text-primary' : 'text-muted-foreground'}`}>
                            P{driver.position}
                          </span>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs h-5 px-1">#{driver.kart}</Badge>
                              <span className={`font-medium ${isUs ? 'text-primary' : ''}`}>
                                {driver.team}
                              </span>
                            </div>
                            {!isUs && (
                              <span className="text-xs text-muted-foreground mt-0.5">
                                Gap: {driver.gap}
                              </span>
                            )}
                          </div>
                        </div>
                        {isUs ? <Badge className="bg-primary text-primary-foreground">VOUS</Badge> : null}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Mobile Controls & Share (Hidden on PC) */}
            <div className="lg:hidden">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => setShowQRCode(!showQRCode)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      {showQRCode ? 'Masquer' : 'Partager'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Plein écran
                    </Button>
                  </div>
                  {showQRCode && (
                    <div className="mt-4 flex flex-col items-center">
                      <div className="p-4 bg-white rounded-lg">
                        <QRCodeSVG value={shareUrl} size={150} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* RIGHT COLUMN: Full Standings (lg: col-span-4) - Always visible on PC */}
          <div className="lg:col-span-4 h-full flex flex-col">
            <Card className="flex-1 flex flex-col h-[calc(100vh-6rem)]">
              <CardHeader className="pb-3 border-b border-border/40 bg-secondary/20">
                <CardTitle className="text-sm flex items-center justify-between uppercase tracking-wide">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                    Classement Live
                  </span>
                  <Badge variant="secondary">{allDrivers.length} Pilotes</Badge>
                </CardTitle>
              </CardHeader>

              {/* Desktop: Scrollable List / Mobile: Collapsible */}
              <div className="lg:hidden">
                <Collapsible open={showFullStandings} onOpenChange={setShowFullStandings}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between rounded-none border-b">
                      <span>{showFullStandings ? 'Masquer' : 'Voir tout'}</span>
                      {showFullStandings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-y-auto max-h-[50vh]">
                      {/* List Content (Repeated logic, ideally componentized) */}
                      {/* ... mobile list content ... */}
                      <StandingsList drivers={allDrivers} myKart={session.selected_kart} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* PC List (Always visible) */}
              <div className="hidden lg:block flex-1 overflow-y-auto custom-scrollbar">
                <StandingsList drivers={allDrivers} myKart={session.selected_kart} />
              </div>
            </Card>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-6">
          <Clock className="h-3 w-3 inline mr-1" />
          Données en direct de {liveData?.circuit || 'la piste'} • Mise à jour automatique
        </div>
      </div>
    </div>

  );
}
