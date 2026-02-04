import { useState, useEffect, useCallback } from 'react';
import { apex } from '@/lib/api';
import { MOCK_CONFIG, getMockTeamDetails } from '@/data/mockRaceData';

interface LapData {
  lapNumber: number;
  s1: number;
  s2: number;
  s3: number;
  total: number;
  s1Best: boolean;
  s2Best: boolean;
  s3Best: boolean;
  totalBest: boolean;
  isPit: boolean;
}

interface DriverInfo {
  id: string;
  num: string;
  name: string;
  isCurrent: boolean;
}

export interface TeamDetails {
  teamId: string;
  teamName: string;
  kartNumber: string;
  club: string;
  color: string;
  currentLap: number;
  currentDriver: DriverInfo | null;
  drivers: DriverInfo[];
  laps: LapData[];
  bestLap: { s1: number; s2: number; s3: number; total: number };
  bestSectors: { s1: number; s2: number; s3: number };
}

export function useTeamDetails(
  circuitId: string | null,
  driverId: string | null,
  refreshInterval: number = 5000
) {
  const [details, setDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    // Mode mock : utiliser les données fictives
    if (MOCK_CONFIG.enabled) {
      setDetails(getMockTeamDetails());
      setError(null);
      setLoading(false);
      return;
    }

    if (!driverId || !circuitId) return;

    setLoading(true);
    try {
      // Use API client
      const data = await apex.getTeamDetails(circuitId, driverId);
      setDetails(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching team details:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [circuitId, driverId]);

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDetails, refreshInterval]);

  return { details, loading, error, refetch: fetchDetails };
}

// Hook pour récupérer les détails de plusieurs équipes
export function useMultipleTeamDetails(
  circuitId: string | null,
  driverIds: string[],
  refreshInterval: number = 5000
) {
  const [detailsMap, setDetailsMap] = useState<Record<string, TeamDetails>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!circuitId || driverIds.length === 0) return;

    setLoading(true);
    try {
      const results = await Promise.all(
        driverIds.map(async (driverId) => {
          try {
            const data = await apex.getTeamDetails(circuitId, driverId);
            return { driverId, data };
          } catch (e) {
            console.error(`Error fetching for ${driverId}:`, e);
            return { driverId, data: null };
          }
        })
      );

      const newMap: Record<string, TeamDetails> = {};
      results.forEach(({ driverId, data }) => {
        if (data) newMap[driverId] = data;
      });
      setDetailsMap(newMap);
    } catch (err) {
      console.error('Error fetching multiple team details:', err);
    } finally {
      setLoading(false);
    }
  }, [circuitId, driverIds]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAll, refreshInterval]);

  return { detailsMap, loading };
}
