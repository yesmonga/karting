// Types for Live Analysis

export interface LiveDriver {
  id: string;
  name: string;
  code: string;
  color: string;
  weightKg: number;
}

export interface LiveRaceConfig {
  raceName: string;
  ballastTarget: number;
  raceDurationMinutes: number;
  pitStopsRequired: number;
  pitStopMinDuration: number;
  circuitId: string;
  drivers: LiveDriver[];
}

export interface ApexDriverData {
  driverId: string;
  position: string;
  kart: string;
  team: string;
  s1: string;
  s2: string;
  s3: string;
  lastLap: string;
  bestLap: string;
  gap: string;
  interval: string;
  laps: string;
  onTrack: string;
  pits: string;
  penalty: string;
}

export interface ApexComment {
  time: string;
  kart: string;
  text: string;
}

export interface ApexLiveData {
  circuit: string;
  session: string;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'TIMEOUT' | 'ERROR' | 'NO_DATA';
  timestamp: string;
  drivers: ApexDriverData[];
  comments?: ApexComment[];
  raceTimeRemaining?: number;  // Temps restant en ms depuis Apex
}

export interface LiveStint {
  id: string;
  stintNumber: number;
  driverId: string | null;
  driverName: string | null;
  startLap: number | null;
  endLap: number | null;
  isActive: boolean;
}

export interface LiveRaceState {
  config: LiveRaceConfig | null;
  selectedKart: string | null;
  selectedTeam: string | null;
  isConnected: boolean;
  liveData: ApexLiveData | null;
  stints: LiveStint[];
  raceStartTime: number | null;
}

// Circuit configuration
export interface CircuitConfig {
  id: string;
  name: string;
  host: string;
  wsPort: number;
}

export const APEX_CIRCUITS: CircuitConfig[] = [
  { id: 'rkc', name: 'Racing Kart Cormeilles', host: 'www.apex-timing.com', wsPort: 8953 },
  { id: 'rko-angerville', name: 'RKO Angerville', host: 'www.apex-timing.com', wsPort: 8953 },
  { id: 'lemans-karting', name: 'Le Mans Karting', host: 'www.apex-timing.com', wsPort: 8953 },
  { id: 'paris-kart', name: 'Paris Kart Indoor', host: 'www.apex-timing.com', wsPort: 8953 },
];

// ============================================
// STRATEGY TYPES
// ============================================

export type StrategySegmentType = 'RUN' | 'PIT';

export interface StrategySegment {
  id: string;
  type: StrategySegmentType;
  startSec: number;
  endSec: number;
  durationSec: number;
  driverId?: string;
  note?: string;
}

export interface LiveRaceStrategy {
  id: string;
  raceId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  lockedToLive?: boolean;
  segments: StrategySegment[];
}

export interface StrategyValidationError {
  type: 'GAP' | 'OVERLAP' | 'MISSING_DRIVER' | 'PIT_TOO_SHORT' | 'NOT_ENOUGH_PITS' | 'TIMELINE_INCOMPLETE';
  segmentId?: string;
  message: string;
}

export interface StrategyValidationResult {
  isValid: boolean;
  errors: StrategyValidationError[];
  totalPits: number;
  totalRunTime: number;
  totalPitTime: number;
}
