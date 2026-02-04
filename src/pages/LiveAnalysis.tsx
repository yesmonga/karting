import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveSetup } from '@/components/live/LiveSetup';
import { TeamSelector } from '@/components/live/TeamSelector';
import { LiveDashboard } from '@/components/live/LiveDashboard';
import { LiveRaceConfig, ApexLiveData, LiveStint, StrategySegment } from '@/types/live';
import { liveSessions, apex } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Trash2, Clock } from 'lucide-react';
import { MOCK_CONFIG, getMockLiveData, getMockRaceConfig, OUR_DRIVERS } from '@/data/mockRaceData';

type LiveStep = 'setup' | 'loading' | 'select-team' | 'dashboard' | 'resume';

const ANONYMOUS_USER_ID = 'anonymous';

interface SavedSession {
  id: string;
  config: LiveRaceConfig;
  selected_kart: string;
  selected_team: string;
  stints: LiveStint[];
  race_start_time: number | null;
  circuit_id: string;
  created_at: string;
}

export default function LiveAnalysis() {
  const [step, setStep] = useState<LiveStep>('loading');
  const [config, setConfig] = useState<LiveRaceConfig | null>(null);
  const [liveData, setLiveData] = useState<ApexLiveData | null>(null);
  const [selectedKart, setSelectedKart] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stints, setStints] = useState<LiveStint[]>([]);
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [strategySegments, setStrategySegments] = useState<StrategySegment[]>([]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing session on mount OR init mock mode
  useEffect(() => {
    // Mode mock : aller directement au dashboard avec les données fictives
    if (MOCK_CONFIG.enabled) {
      const mockConfig = getMockRaceConfig() as LiveRaceConfig;
      setConfig(mockConfig);
      setSelectedKart(MOCK_CONFIG.ourKart);
      setSelectedTeam(MOCK_CONFIG.ourTeam);
      setRaceStartTime(MOCK_CONFIG.raceStartTime);
      setIsConnected(true);
      setLiveData(getMockLiveData());

      const initialStints: LiveStint[] = [];
      for (let i = 1; i <= mockConfig.pitStopsRequired + 1; i++) {
        initialStints.push({
          id: `stint-${i}`,
          stintNumber: i,
          driverId: i === 1 ? OUR_DRIVERS[0].id : null,
          driverName: i === 1 ? OUR_DRIVERS[0].name : null,
          startLap: null,
          endLap: null,
          isActive: i === 1,
        });
      }
      setStints(initialStints);
      setSessionId('mock-session');
      setStep('dashboard');
      return;
    }

    const checkExistingSession = async () => {
      try {
        // 1. Check URL parameters first
        const params = new URLSearchParams(window.location.search);
        const urlSessionId = params.get('sessionId');

        let data = null;

        if (urlSessionId) {
          console.log(`Loading session from URL: ${urlSessionId}`);
          data = await liveSessions.getById(urlSessionId);
        }

        // 2. Fallback to latest user session if not found in URL
        if (!data) {
          data = await liveSessions.getByUser(ANONYMOUS_USER_ID);
        }

        if (data) {
          setSavedSession({
            id: data.id,
            config: data.config as unknown as LiveRaceConfig,
            selected_kart: data.selected_kart,
            selected_team: data.selected_team,
            stints: (data.stints as unknown as LiveStint[]) || [],
            race_start_time: data.race_start_time || null,
            circuit_id: data.circuit_id,
            created_at: data.created_at,
          });

          // Ensure URL is synced if we loaded from 'latest'
          if (!urlSessionId) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('sessionId', data.id);
            window.history.replaceState({}, '', newUrl);
          }

          if (urlSessionId) {
            console.log('Auto-resuming session from URL...');
            resumeSession({
              id: data.id,
              config: data.config as unknown as LiveRaceConfig,
              selected_kart: data.selected_kart,
              selected_team: data.selected_team,
              stints: (data.stints as unknown as LiveStint[]) || [],
              race_start_time: data.race_start_time || null,
              circuit_id: data.circuit_id,
              created_at: data.created_at,
            }, true);
          } else {
            setStep('resume');
          }
        } else {
          setStep('setup');
        }
      } catch {
        setStep('setup');
      }
    };

    checkExistingSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save session to database
  const saveSession = useCallback(async (
    configData: LiveRaceConfig,
    kart: string,
    team: string,
    stintsData: LiveStint[],
    startTime: number | null
  ) => {
    try {
      const sessionData = {
        id: sessionId || undefined,
        user_id: ANONYMOUS_USER_ID,
        config: configData,
        selected_kart: kart,
        selected_team: team,
        stints: stintsData,
        race_start_time: startTime,
        circuit_id: configData.circuitId,
      };

      const result = await liveSessions.save(sessionData);
      if (result && !sessionId) {
        setSessionId(result.id);
        // INFO: Update URL with new session ID
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('sessionId', result.id);
        window.history.replaceState({}, '', newUrl);
        console.log('Session created, URL updated:', result.id);
      }
      return result?.id || null;
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  }, [sessionId]);

  // Update stints in database
  const updateSessionStints = useCallback(async (newStints: LiveStint[]) => {
    setStints(newStints);

    if (sessionId) {
      try {
        await liveSessions.updateStints(sessionId, newStints);
      } catch (error) {
        console.error('Error updating stints:', error);
      }
    }
  }, [sessionId]);

  // Delete session
  const deleteSession = async () => {
    setSavedSession(null);
    setStep('setup');
  };

  // Resume session
  const resumeSession = async (sessionToResume = savedSession, isAutoResume = false) => {
    if (!sessionToResume) return;

    setConfig(sessionToResume.config);
    setSelectedKart(sessionToResume.selected_kart);
    setSelectedTeam(sessionToResume.selected_team);
    setStints(sessionToResume.stints);
    setRaceStartTime(sessionToResume.race_start_time);
    setSessionId(sessionToResume.id);

    setSessionId(sessionToResume.id);

    // Optimistic resume: Go to dashboard immediately
    if (isAutoResume) {
      console.log('Optimistic auto-resume: switching to dashboard');
      setStep('dashboard');
      return;
    }

    // Manual resume: show loading, wait for result
    toast.loading('Reconnexion à Apex Timing...', { id: 'apex-connect' });

    const data = await fetchApexData(sessionToResume.circuit_id, sessionToResume.id);

    if (data) {
      setLiveData(data);
      toast.success('Session restaurée', { id: 'apex-connect' });
      setStep('dashboard');
    } else {
      toast.error('Impossible de se reconnecter', { id: 'apex-connect' });
    }
  };

  // Fetch data from Apex Timing via our API
  const fetchApexData = useCallback(async (circuitId: string, sessId?: string): Promise<ApexLiveData | null> => {
    try {
      console.log(`Fetching apex-live for circuit: ${circuitId}`);

      const data = await apex.getLiveData(circuitId, sessId);

      console.log('Apex-live response:', data);

      if (data.status === 'CONNECTED' || data.drivers?.length > 0) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }

      return data as ApexLiveData;
    } catch (err) {
      console.error('Fetch error:', err);
      setIsConnected(false);
      return null;
    }
  }, []);

  // Handle setup completion
  const handleSetupComplete = async (newConfig: LiveRaceConfig, strategy?: StrategySegment[]) => {
    setConfig(newConfig);
    if (strategy) {
      setStrategySegments(strategy);
    }

    // WindCircuit = mode test avec données mock
    if (newConfig.circuitId === 'wind-circuit') {
      toast.success('Mode test WindCircuit activé', { id: 'apex-connect' });
      const mockData = getMockLiveData();
      setLiveData(mockData);
      setIsConnected(true);
      setStep('select-team');
      return;
    }

    setStep('loading');
    toast.loading('Connexion WebSocket à Apex Timing...', { id: 'apex-connect' });

    const data = await fetchApexData(newConfig.circuitId, sessionId || undefined);

    if (data && data.drivers && data.drivers.length > 0) {
      setLiveData(data);
      toast.success(`${data.drivers.length} équipes détectées via WebSocket`, { id: 'apex-connect' });
      setStep('select-team');
    } else {
      const errorMsg = data?.status === 'TIMEOUT'
        ? 'Timeout de connexion. Aucune session active?'
        : data?.status === 'ERROR'
          ? 'Erreur de connexion WebSocket'
          : 'Aucune donnée reçue. Vérifiez qu\'une session est active.';
      toast.error(errorMsg, { id: 'apex-connect' });
      setStep('setup');
    }
  };

  // Handle team selection
  const handleTeamSelect = async (kart: string, teamName: string) => {
    setSelectedKart(kart);
    setSelectedTeam(teamName);
    const startTime = Date.now();
    setRaceStartTime(startTime);

    // Initialize stints based on pit stops required
    const initialStints: LiveStint[] = [];
    for (let i = 1; i <= (config?.pitStopsRequired || 5) + 1; i++) {
      initialStints.push({
        id: crypto.randomUUID(),
        stintNumber: i,
        driverId: null,
        driverName: null,
        startLap: null,
        endLap: null,
        isActive: i === 1,
      });
    }
    setStints(initialStints);

    // Save session to database
    if (config) {
      await saveSession(config, kart, teamName, initialStints, startTime);
    }

    toast.success(`Suivi du Kart #${kart} activé`);
    setStep('dashboard');
  };

  // Start polling when on dashboard
  useEffect(() => {
    if (step === 'dashboard' && config) {
      // WindCircuit = mode test, utiliser les données mock
      if (config.circuitId === 'wind-circuit') {
        const pollMock = () => {
          setLiveData(getMockLiveData());
        };
        pollMock();
        pollingRef.current = setInterval(pollMock, 3000);
        return () => {
          if (pollingRef.current) clearInterval(pollingRef.current);
        };
      }

      const poll = async () => {
        const data = await fetchApexData(config.circuitId);
        if (data) {
          setLiveData(data);
        }
      };

      // Initial fetch
      poll();

      // Poll every 3 seconds
      pollingRef.current = setInterval(poll, 3000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [step, config, fetchApexData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Render based on current step
  switch (step) {
    case 'setup':
      return <LiveSetup onSetupComplete={handleSetupComplete} />;

    case 'resume':
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Course:</strong> {savedSession?.config.raceName}</p>
                <p><strong>Kart:</strong> #{savedSession?.selected_kart}</p>
                <p><strong>Équipe:</strong> {savedSession?.selected_team}</p>
                <p><strong>Circuit:</strong> {savedSession?.circuit_id}</p>
                <p className="text-muted-foreground">
                  Créée le {new Date(savedSession?.created_at || '').toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => resumeSession()} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Reprendre
                </Button>
                <Button variant="outline" onClick={deleteSession}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>

              <Button variant="ghost" onClick={() => setStep('setup')} className="w-full">
                Nouvelle session
              </Button>
            </CardContent>
          </Card>
        </div>
      );

    case 'loading':
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Connexion WebSocket à Apex Timing...</p>
            <p className="text-xs text-muted-foreground mt-2 mb-4">Circuit: {config?.circuitId}</p>
            <Button variant="outline" size="sm" onClick={() => setStep('setup')}>
              Annuler et retourner au menu
            </Button>
          </div>
        </div>
      );

    case 'select-team':
      return liveData ? (
        <TeamSelector
          teams={liveData.drivers}
          onTeamSelect={handleTeamSelect}
        />
      ) : null;

    case 'dashboard':
      return config && selectedKart && selectedTeam ? (
        <LiveDashboard
          config={config}
          selectedKart={selectedKart}
          selectedTeam={selectedTeam}
          liveData={liveData}
          isConnected={isConnected}
          stints={stints}
          onStintUpdate={updateSessionStints}
          raceStartTime={raceStartTime}
          circuitId={config.circuitId}
          sessionId={sessionId}
          strategySegments={strategySegments}
          onStrategyUpdate={setStrategySegments}
        />
      ) : null;

    default:
      return null;
  }
}
