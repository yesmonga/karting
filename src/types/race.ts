// Types for imported races

export interface ImportedLapData {
  lap: number;
  s1: number;
  s2: number;
  s3: number;
  total: number;
}

export interface ParsedStintData {
  stintNumber: number;
  endLap: number;           // Tour de l'arrêt
  trackTime: string;        // "En piste" - temps passé en piste (format "01:07:56")
  trackTimeMs: number;      // En piste en millisecondes
  lapsCount: number;        // "Tours Pilote" - nombre de tours
  bestLap: string;          // "Meilleur Tour" (format "1:05.495")
  bestLapMs: number;        // Meilleur tour en millisecondes
  avgLap: string;           // "Moy." - moyenne (format "1:05.126")
  avgLapMs: number;         // Moyenne en millisecondes
  pitDuration: string;      // "Stands" - durée de l'arrêt
  pitDurationMs: number;    // Durée arrêt en millisecondes
  isFinish: boolean;        // true si "(Arrivée)"
}

export interface ImportedStint {
  stint: number;
  driver: string;
  code: string;
  startLap: number;
  endLap: number;
  trackTimeMs?: number;
  bestLapMs?: number;
  avgLapMs?: number;
  lapsCount?: number;
  note?: string;
}

export interface ImportedDriver {
  name: string;
  fullName: string;
  code: string;
  color: string;
  weightKg?: number;
}

export interface TeamData {
  kartNumber: number;
  teamName: string;
  position: number;
  bestLap: number;
  bestLapStr?: string;
  totalLaps: number;
  ecart?: string;            // Ecart avec le premier
  sector1?: number;          // Meilleur S1
  sector2?: number;          // Meilleur S2
  sector3?: number;          // Meilleur S3
  penalty?: string;          // Pénalité
  laps: ImportedLapData[];
  stints: ParsedStintData[];
  pitStops: number[];
}

export interface ImportedRace {
  id: string;
  name: string;
  date: string;
  trackName: string;
  raceType: string;
  sessionType: 'essais' | 'qualif' | 'course';
  duration?: string;
  teamName: string;
  kartNumber: number;
  position: number;
  totalKarts: number;
  laps: ImportedLapData[];
  stints: ImportedStint[];
  drivers: Record<string, ImportedDriver>;
  pitStops: number[];
  createdAt: string;
}

export interface ParsedPDFData {
  teams: TeamData[];
  sessionType: 'essais' | 'qualif' | 'course';
  trackName?: string;
  raceName?: string;
  date?: string;
  totalKarts: number;
}

export interface RaceFilter {
  raceId?: string;
  driverName?: string;
}
