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
      <div className={`mx-auto space-y-4 ${isFullscreen ? 'max-w-4xl' : 'max-w-lg'}`}>
        {/* Header with Race Info */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className={`font-racing font-bold ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                    {session.config.raceName}
                  </h1>
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                <p className="text-sm text-muted-foreground">{liveData?.circuit || session.circuit_id}</p>
              </div>

              {/* Time Remaining */}
              {liveData?.raceTimeRemaining && liveData.raceTimeRemaining > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Temps restant</p>
                  <p className={`font-racing font-bold text-primary ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                    {formatTimeRemaining(liveData.raceTimeRemaining)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Main Team Card */}
        <Card className="border-2 border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-primary/20 ${isFullscreen ? 'p-4' : ''}`}>
                  <Car className={`text-primary ${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kart #{session.selected_kart}</p>
                  <h2 className={`font-racing font-bold text-primary ${isFullscreen ? 'text-3xl' : 'text-2xl'}`}>
                    {session.selected_team}
                  </h2>
                </div>
              </div>

              {/* Position Badge */}
              <div className="text-center">
                <div className={`font-racing font-bold ${isFullscreen ? 'text-6xl' : 'text-4xl'}`}>
                  P{myTeam?.position || '--'}
                </div>
                <p className="text-xs text-muted-foreground">/{allDrivers.length || '--'} karts</p>
              </div>
            </div>

            {/* Active Driver */}
            {activeStint?.driverName && (
              <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pilote en piste:</span>
                <Badge variant="outline" className="font-racing">{activeStint.driverName}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Stats Grid */}
        <div className={`grid gap-3 ${isFullscreen ? 'grid-cols-4' : 'grid-cols-2'}`}>
          <Card>
            <CardContent className={`text-center ${isFullscreen ? 'p-6' : 'p-4'}`}>
              <Flag className={`mx-auto mb-2 text-primary ${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
              <div className={`font-racing font-bold ${isFullscreen ? 'text-4xl' : 'text-3xl'}`}>
                {myTeam?.laps || '--'}
              </div>
              <div className="text-xs text-muted-foreground">Tours</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className={`text-center ${isFullscreen ? 'p-6' : 'p-4'}`}>
              <Timer className={`mx-auto mb-2 text-green-500 ${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
              <div className={`font-racing font-bold ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                {myTeam?.bestLap || '--'}
              </div>
              <div className="text-xs text-muted-foreground">Meilleur Tour</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className={`text-center ${isFullscreen ? 'p-6' : 'p-4'}`}>
              <Gauge className={`mx-auto mb-2 text-blue-500 ${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
              <div className={`font-racing font-bold ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                {myTeam?.lastLap || '--'}
              </div>
              <div className="text-xs text-muted-foreground">Dernier Tour</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className={`text-center ${isFullscreen ? 'p-6' : 'p-4'}`}>
              <Users className={`mx-auto mb-2 text-amber-500 ${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
              <div className={`font-racing font-bold ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                {myTeam?.pits || '0'}
                <span className="text-sm text-muted-foreground">/{session.config.pitStopsRequired}</span>
              </div>
              <div className="text-xs text-muted-foreground">Arrêts</div>
            </CardContent>
          </Card>
        </div>

        {/* Gap Info */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Écart Leader</div>
                <div className={`font-racing font-bold ${isFullscreen ? 'text-2xl' : 'text-lg'} ${myTeam?.gap ? 'text-red-400' : ''}`}>
                  {myTeam?.gap || '--'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Intervalle</div>
                <div className={`font-racing font-bold ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                  {myTeam?.interval || '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nearby Karts */}
        {nearbyKarts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Karts Proches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nearbyKarts.map((driver) => {
                const isUs = driver.kart === session.selected_kart;
                return (
                  <div
                    key={driver.kart}
                    className={`flex items-center justify-between p-2 rounded-lg ${isUs ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-racing font-bold w-8 ${isFullscreen ? 'text-xl' : 'text-lg'}`}>
                        P{driver.position}
                      </span>
                      <span className="text-sm text-muted-foreground">#{driver.kart}</span>
                      <span className={`font-medium truncate max-w-[120px] ${isUs ? 'text-primary' : ''}`}>
                        {driver.team}
                        {isUs && ' ★'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">{driver.gap || '--'}</div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Sectors */}
        {myTeam && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Secteurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-xs text-muted-foreground">S1</div>
                  <div className={`font-mono font-bold ${isFullscreen ? 'text-lg' : ''}`}>{myTeam.s1 || '--'}</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-xs text-muted-foreground">S2</div>
                  <div className={`font-mono font-bold ${isFullscreen ? 'text-lg' : ''}`}>{myTeam.s2 || '--'}</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="text-xs text-muted-foreground">S3</div>
                  <div className={`font-mono font-bold ${isFullscreen ? 'text-lg' : ''}`}>{myTeam.s3 || '--'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Standings (Collapsible) */}
        <Collapsible open={showFullStandings} onOpenChange={setShowFullStandings}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Classement Complet
                  </span>
                  {showFullStandings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="max-h-80 overflow-y-auto space-y-1">
                {allDrivers.map((driver) => {
                  const isUs = driver.kart === session.selected_kart;
                  return (
                    <div
                      key={driver.kart}
                      className={`flex items-center justify-between p-2 rounded text-sm ${isUs ? 'bg-primary/20 border border-primary/30' : 'hover:bg-secondary/30'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-racing font-bold w-6">P{driver.position}</span>
                        <span className="text-muted-foreground">#{driver.kart}</span>
                        <span className={`truncate max-w-[100px] ${isUs ? 'text-primary font-medium' : ''}`}>
                          {driver.team}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span>{driver.laps}t</span>
                        <span className="text-muted-foreground">{driver.gap || '-'}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* QR Code & Share */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQRCode(!showQRCode)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {showQRCode ? 'Masquer QR' : 'Partager'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                {isFullscreen ? 'Quitter' : 'Plein écran'}
              </Button>
            </div>

            {showQRCode && (
              <div className="mt-4 flex flex-col items-center">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={shareUrl} size={150} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Scannez pour suivre la course
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <Clock className="h-3 w-3 inline mr-1" />
          Mise à jour automatique toutes les 5 secondes
        </div>
      </div>
    </div>
  );
}
