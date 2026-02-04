import { useState, useEffect, useCallback, useRef } from 'react';
import { LiveSetup } from '@/components/live/LiveSetup';
import { TeamSelector } from '@/components/live/TeamSelector';
import { LiveDashboard } from '@/components/live/LiveDashboard';
import { LiveRaceConfig, ApexLiveData, LiveStint, StrategySegment } from '@/types/live';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Json } from '@/integrations/supabase/types';
import { Play, Trash2, Clock } from 'lucide-react';
import { MOCK_CONFIG, getMockLiveData, getMockRaceConfig, OUR_DRIVERS } from '@/data/mockRaceData';

type LiveStep = 'setup' | 'loading' | 'select-team' | 'dashboard' | 'resume';

// Anonymous user ID for non-authenticated mode
const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

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
  const { user } = useAuth();
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

      // Initialiser les stints
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
      const userId = user?.id || ANONYMOUS_USER_ID;

      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setSavedSession({
          id: data.id,
          config: data.config as unknown as LiveRaceConfig,
          selected_kart: data.selected_kart,
          selected_team: data.selected_team,
          stints: (data.stints as unknown as LiveStint[]) || [],
          race_start_time: data.race_start_time,
          circuit_id: data.circuit_id,
          created_at: data.created_at,
        });
        setStep('resume');
      } else {
        setStep('setup');
      }
    };

    checkExistingSession();
  }, [user]);

  // Save session to database
  const saveSession = useCallback(async (
    configData: LiveRaceConfig,
    kart: string,
    team: string,
    stintsData: LiveStint[],
    startTime: number | null
  ) => {
    const userId = user?.id || ANONYMOUS_USER_ID;

    const sessionData = {
      user_id: userId,
      config: JSON.parse(JSON.stringify(configData)) as Json,
      selected_kart: kart,
      selected_team: team,
      stints: JSON.parse(JSON.stringify(stintsData)) as Json,
      race_start_time: startTime,
      circuit_id: configData.circuitId,
    };

    if (sessionId) {
      // Update existing session
      await supabase
        .from('live_sessions')
        .update(sessionData)
        .eq('id', sessionId);
      return sessionId;
    } else {
      // Create new session
      const { data, error } = await supabase
        .from('live_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (data && !error) {
        setSessionId(data.id);
        return data.id;
      }
    }
    return null;
  }, [user, sessionId]);

  // Update stints in database
  const updateSessionStints = useCallback(async (newStints: LiveStint[]) => {
    setStints(newStints);

    if (sessionId) {
      await supabase
        .from('live_sessions')
        .update({ stints: JSON.parse(JSON.stringify(newStints)) as Json })
        .eq('id', sessionId);
    }
  }, [sessionId]);

  // Delete session
  const deleteSession = async () => {
    if (savedSession) {
      await supabase
        .from('live_sessions')
        .delete()
        .eq('id', savedSession.id);
      setSavedSession(null);
    }
    setStep('setup');
  };

  // Resume session
  const resumeSession = async () => {
    if (!savedSession) return;

    setConfig(savedSession.config);
    setSelectedKart(savedSession.selected_kart);
    setSelectedTeam(savedSession.selected_team);
    setStints(savedSession.stints);
    setRaceStartTime(savedSession.race_start_time);
    setSessionId(savedSession.id);

    toast.loading('Reconnexion à Apex Timing...', { id: 'apex-connect' });

    const data = await fetchApexData(savedSession.circuit_id);

    if (data) {
      setLiveData(data);
      toast.success('Session restaurée', { id: 'apex-connect' });
      setStep('dashboard');
    } else {
      toast.error('Impossible de se reconnecter', { id: 'apex-connect' });
    }
  };

  // Fetch data from Apex Timing via WebSocket edge function
  const fetchApexData = useCallback(async (circuitId: string): Promise<ApexLiveData | null> => {
    try {
      console.log(`Fetching apex-live for circuit: ${circuitId}`);

      const { data, error } = await supabase.functions.invoke('apex-live', {
        body: { circuitId }
      });

      if (error) {
        console.error('Edge function error:', error);
        setIsConnected(false);
        return null;
      }

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

    const data = await fetchApexData(newConfig.circuitId);

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
                <Button onClick={resumeSession} className="flex-1">
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
            <p className="text-xs text-muted-foreground mt-2">Circuit: {config?.circuitId}</p>
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
