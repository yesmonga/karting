import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApexLiveData } from '@/types/live';
import { MOCK_CONFIG, getMockLiveData } from '@/data/mockRaceData';

export function useApexLiveData(circuitId: string, refreshInterval: number = 3000) {
  const [data, setData] = useState<ApexLiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Mode mock : utiliser les données fictives
    if (MOCK_CONFIG.enabled) {
      setData(getMockLiveData());
      setError(null);
      setLoading(false);
      return;
    }

    if (!circuitId) return;

    try {
      const { data: result, error: fetchError } = await supabase.functions.invoke('apex-live', {
        body: { circuitId },
      });

      if (fetchError) {
        throw fetchError;
      }

      setData(result as ApexLiveData);
      setError(null);
    } catch (err) {
      console.error('Error fetching apex live data:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [circuitId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}
