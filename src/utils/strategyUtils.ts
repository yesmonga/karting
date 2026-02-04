import {
  StrategySegment,
  StrategyValidationResult,
  StrategyValidationError,
  LiveDriver,
} from '@/types/live';

function generateId(): string {
  return crypto.randomUUID();
}

// ============ STRATEGY PRESETS ============

export type StrategyPreset = 'BALANCED' | 'UNDERCUT' | 'OVERCUT';

export interface StrategyPresetInfo {
  id: StrategyPreset;
  name: string;
  description: string;
  icon: string;
}

export const STRATEGY_PRESETS: StrategyPresetInfo[] = [
  {
    id: 'BALANCED',
    name: 'Régularité (Auto)',
    description: 'Relais équilibrés mathématiquement',
    icon: '⚖️',
  },
  {
    id: 'UNDERCUT',
    name: 'Undercut Agressif',
    description: 'Éviter le trafic du départ, relais court initial (~12min)',
    icon: '🚀',
  },
  {
    id: 'OVERCUT',
    name: 'Overcut (Piste Claire)',
    description: 'Rester en piste, décaler les arrêts (~35min initial)',
    icon: '🏁',
  },
];

/**
 * Génère une stratégie selon un preset
 */
export function generatePresetStrategy(
  preset: StrategyPreset,
  drivers: LiveDriver[],
  raceDurationMinutes: number,
  pitStopsRequired: number,
  pitStopMinDuration: number
): StrategySegment[] {
  if (drivers.length === 0) return [];

  const totalRaceSec = raceDurationMinutes * 60;
  const numRuns = pitStopsRequired + 1;

  switch (preset) {
    case 'UNDERCUT':
      return generateUndercutStrategy(drivers, totalRaceSec, numRuns, pitStopMinDuration);
    case 'OVERCUT':
      return generateOvercutStrategy(drivers, totalRaceSec, numRuns, pitStopMinDuration);
    case 'BALANCED':
    default:
      return generateAutoStrategy(drivers, raceDurationMinutes, pitStopsRequired, pitStopMinDuration);
  }
}

/**
 * UNDERCUT: Relais court initial (~12min) pour éviter le chaos du départ
 * Structure: Short Stint A -> PIT -> Long Stint B (Clean Air) -> Standard...
 */
function generateUndercutStrategy(
  drivers: LiveDriver[],
  totalRaceSec: number,
  numRuns: number,
  pitStopMinDuration: number
): StrategySegment[] {
  const segments: StrategySegment[] = [];
  const totalPitSec = (numRuns - 1) * pitStopMinDuration;
  const totalRunSec = totalRaceSec - totalPitSec;

  // Premier stint court: ~12 minutes (720 sec)
  const firstStintDuration = Math.min(720, Math.floor(totalRunSec * 0.1));
  
  // Deuxième stint long: ~35 minutes (2100 sec) pour profiter de la piste claire
  const secondStintDuration = Math.min(2100, Math.floor(totalRunSec * 0.3));
  
  // Temps restant pour les autres stints
  const remainingRunSec = totalRunSec - firstStintDuration - secondStintDuration;
  const remainingRuns = numRuns - 2;
  const avgRemainingDuration = remainingRuns > 0 ? Math.floor(remainingRunSec / remainingRuns) : 0;

  let currentSec = 0;
  let driverIndex = 0;

  for (let i = 0; i < numRuns; i++) {
    const driver = drivers[driverIndex % drivers.length];
    let runDuration: number;

    if (i === 0) {
      runDuration = firstStintDuration;
    } else if (i === 1) {
      runDuration = secondStintDuration;
    } else if (i === numRuns - 1) {
      // Dernier stint prend le reste
      runDuration = totalRaceSec - currentSec - ((numRuns - 1 - i) * pitStopMinDuration);
    } else {
      runDuration = avgRemainingDuration;
    }

    segments.push({
      id: generateId(),
      type: 'RUN',
      startSec: currentSec,
      endSec: currentSec + runDuration,
      durationSec: runDuration,
      driverId: driver.id,
    });
    currentSec += runDuration;
    driverIndex++;

    // Pit après chaque run sauf le dernier
    if (i < numRuns - 1) {
      segments.push({
        id: generateId(),
        type: 'PIT',
        startSec: currentSec,
        endSec: currentSec + pitStopMinDuration,
        durationSec: pitStopMinDuration,
      });
      currentSec += pitStopMinDuration;
    }
  }

  return segments;
}

/**
 * OVERCUT: Stint initial long (~35min) pour rester en piste pendant que les autres pitent
 * Structure: Extended Stint A -> PIT -> Sprint Stint B -> Standard...
 */
function generateOvercutStrategy(
  drivers: LiveDriver[],
  totalRaceSec: number,
  numRuns: number,
  pitStopMinDuration: number
): StrategySegment[] {
  const segments: StrategySegment[] = [];
  const totalPitSec = (numRuns - 1) * pitStopMinDuration;
  const totalRunSec = totalRaceSec - totalPitSec;

  // Premier stint long: ~35 minutes (2100 sec)
  const firstStintDuration = Math.min(2100, Math.floor(totalRunSec * 0.35));
  
  // Deuxième stint sprint: ~15 minutes (900 sec)
  const secondStintDuration = Math.min(900, Math.floor(totalRunSec * 0.15));
  
  // Temps restant pour les autres stints
  const remainingRunSec = totalRunSec - firstStintDuration - secondStintDuration;
  const remainingRuns = numRuns - 2;
  const avgRemainingDuration = remainingRuns > 0 ? Math.floor(remainingRunSec / remainingRuns) : 0;

  let currentSec = 0;
  let driverIndex = 0;

  for (let i = 0; i < numRuns; i++) {
    const driver = drivers[driverIndex % drivers.length];
    let runDuration: number;

    if (i === 0) {
      runDuration = firstStintDuration;
    } else if (i === 1) {
      runDuration = secondStintDuration;
    } else if (i === numRuns - 1) {
      // Dernier stint prend le reste
      runDuration = totalRaceSec - currentSec;
    } else {
      runDuration = avgRemainingDuration;
    }

    segments.push({
      id: generateId(),
      type: 'RUN',
      startSec: currentSec,
      endSec: currentSec + runDuration,
      durationSec: runDuration,
      driverId: driver.id,
    });
    currentSec += runDuration;
    driverIndex++;

    // Pit après chaque run sauf le dernier
    if (i < numRuns - 1) {
      segments.push({
        id: generateId(),
        type: 'PIT',
        startSec: currentSec,
        endSec: currentSec + pitStopMinDuration,
        durationSec: pitStopMinDuration,
      });
      currentSec += pitStopMinDuration;
    }
  }

  return segments;
}

/**
 * Génère une stratégie automatique équilibrée
 */
export function generateAutoStrategy(
  drivers: LiveDriver[],
  raceDurationMinutes: number,
  pitStopsRequired: number,
  pitStopMinDuration: number
): StrategySegment[] {
  if (drivers.length === 0) return [];

  const totalRaceSec = raceDurationMinutes * 60;
  const totalPitSec = pitStopsRequired * pitStopMinDuration;
  const totalRunSec = totalRaceSec - totalPitSec;
  const numRuns = pitStopsRequired + 1;

  // Durée moyenne par run
  const avgRunDuration = Math.floor(totalRunSec / numRuns);
  let remainingRunSec = totalRunSec;

  const segments: StrategySegment[] = [];
  let currentSec = 0;

  for (let i = 0; i < numRuns; i++) {
    // Alterner les pilotes
    const driver = drivers[i % drivers.length];

    // Calculer la durée du run (dernier run prend le reste)
    const isLastRun = i === numRuns - 1;
    const runDuration = isLastRun ? remainingRunSec : avgRunDuration;
    remainingRunSec -= runDuration;

    // Ajouter le RUN
    segments.push({
      id: generateId(),
      type: 'RUN',
      startSec: currentSec,
      endSec: currentSec + runDuration,
      durationSec: runDuration,
      driverId: driver.id,
    });
    currentSec += runDuration;

    // Ajouter un PIT après chaque run sauf le dernier
    if (i < numRuns - 1) {
      segments.push({
        id: generateId(),
        type: 'PIT',
        startSec: currentSec,
        endSec: currentSec + pitStopMinDuration,
        durationSec: pitStopMinDuration,
      });
      currentSec += pitStopMinDuration;
    }
  }

  return segments;
}

/**
 * Valide une stratégie selon les contraintes
 */
export function validateStrategy(
  segments: StrategySegment[],
  raceDurationMinutes: number,
  pitStopsRequired: number,
  pitStopMinDuration: number
): StrategyValidationResult {
  const errors: StrategyValidationError[] = [];
  const totalRaceSec = raceDurationMinutes * 60;

  // Trier par startSec
  const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);

  let totalPits = 0;
  let totalRunTime = 0;
  let totalPitTime = 0;

  // Vérifier que la timeline commence à 0
  if (sorted.length === 0 || sorted[0].startSec !== 0) {
    errors.push({
      type: 'TIMELINE_INCOMPLETE',
      message: 'La stratégie doit commencer à 0:00',
    });
  }

  // Vérifier chaque segment
  for (let i = 0; i < sorted.length; i++) {
    const segment = sorted[i];
    const nextSegment = sorted[i + 1];

    // Vérifier RUN a un pilote
    if (segment.type === 'RUN' && !segment.driverId) {
      errors.push({
        type: 'MISSING_DRIVER',
        segmentId: segment.id,
        message: `Le run ${i + 1} n'a pas de pilote assigné`,
      });
    }

    // Compter les pits et vérifier durée min
    if (segment.type === 'PIT') {
      totalPits++;
      totalPitTime += segment.durationSec;
      if (segment.durationSec < pitStopMinDuration) {
        errors.push({
          type: 'PIT_TOO_SHORT',
          segmentId: segment.id,
          message: `L'arrêt ${totalPits} dure ${segment.durationSec}s (min: ${pitStopMinDuration}s)`,
        });
      }
    } else {
      totalRunTime += segment.durationSec;
    }

    // Vérifier pas de gap entre segments
    if (nextSegment && segment.endSec !== nextSegment.startSec) {
      if (segment.endSec < nextSegment.startSec) {
        errors.push({
          type: 'GAP',
          segmentId: segment.id,
          message: `Trou de ${nextSegment.startSec - segment.endSec}s entre les segments`,
        });
      } else {
        errors.push({
          type: 'OVERLAP',
          segmentId: segment.id,
          message: `Chevauchement de ${segment.endSec - nextSegment.startSec}s entre les segments`,
        });
      }
    }
  }

  // Vérifier que la timeline finit à la durée de course
  const lastSegment = sorted[sorted.length - 1];
  if (lastSegment && lastSegment.endSec !== totalRaceSec) {
    errors.push({
      type: 'TIMELINE_INCOMPLETE',
      message: `La stratégie se termine à ${formatTime(lastSegment.endSec)} au lieu de ${formatTime(totalRaceSec)}`,
    });
  }

  // Vérifier nombre minimum de pits
  if (totalPits < pitStopsRequired) {
    errors.push({
      type: 'NOT_ENOUGH_PITS',
      message: `${totalPits} arrêts prévus (minimum: ${pitStopsRequired})`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalPits,
    totalRunTime,
    totalPitTime,
  };
}

/**
 * Formate des secondes en mm:ss ou hh:mm:ss
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calcule le lest pour un pilote
 */
export function calculateBallastForDriver(driverWeightKg: number, ballastTarget: number): number {
  return Math.max(0, ballastTarget - driverWeightKg);
}

/**
 * Insère un pit stop entre deux runs
 */
export function insertPitBetweenRuns(
  segments: StrategySegment[],
  afterSegmentId: string,
  pitDuration: number
): StrategySegment[] {
  const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);
  const index = sorted.findIndex((s) => s.id === afterSegmentId);

  if (index === -1 || index === sorted.length - 1) return segments;

  const currentSegment = sorted[index];
  const nextSegment = sorted[index + 1];

  // Créer le nouveau pit
  const newPit: StrategySegment = {
    id: generateId(),
    type: 'PIT',
    startSec: currentSegment.endSec,
    endSec: currentSegment.endSec + pitDuration,
    durationSec: pitDuration,
  };

  // Décaler tous les segments suivants
  const result: StrategySegment[] = [];
  for (const seg of sorted) {
    if (seg.startSec > currentSegment.endSec) {
      result.push({
        ...seg,
        startSec: seg.startSec + pitDuration,
        endSec: seg.endSec + pitDuration,
      });
    } else {
      result.push(seg);
    }
  }

  // Insérer le pit
  result.splice(index + 1, 0, newPit);

  return result;
}

/**
 * Split un run en deux avec un pit au milieu
 */
export function splitRunWithPit(
  segments: StrategySegment[],
  runId: string,
  splitAtSec: number,
  pitDuration: number,
  secondDriverId?: string
): StrategySegment[] {
  const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);
  const index = sorted.findIndex((s) => s.id === runId);

  if (index === -1) return segments;

  const run = sorted[index];
  if (run.type !== 'RUN') return segments;
  if (splitAtSec <= run.startSec || splitAtSec >= run.endSec) return segments;

  // Première partie du run
  const run1: StrategySegment = {
    id: generateId(),
    type: 'RUN',
    startSec: run.startSec,
    endSec: splitAtSec,
    durationSec: splitAtSec - run.startSec,
    driverId: run.driverId,
  };

  // Pit
  const pit: StrategySegment = {
    id: generateId(),
    type: 'PIT',
    startSec: splitAtSec,
    endSec: splitAtSec + pitDuration,
    durationSec: pitDuration,
  };

  // Deuxième partie du run (décalée)
  const run2: StrategySegment = {
    id: generateId(),
    type: 'RUN',
    startSec: splitAtSec + pitDuration,
    endSec: run.endSec + pitDuration,
    durationSec: run.endSec - splitAtSec,
    driverId: secondDriverId || run.driverId,
  };

  // Reconstruire avec décalage des segments suivants
  const result: StrategySegment[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i === index) {
      result.push(run1, pit, run2);
    } else if (sorted[i].startSec > run.endSec) {
      result.push({
        ...sorted[i],
        startSec: sorted[i].startSec + pitDuration,
        endSec: sorted[i].endSec + pitDuration,
      });
    } else {
      result.push(sorted[i]);
    }
  }

  return result;
}

/**
 * Recalcule les segments à partir d'un temps donné pour tenir dans la durée de course
 */
export function rebalanceFromTime(
  segments: StrategySegment[],
  fromSec: number,
  raceDurationSec: number,
  pitStopMinDuration: number
): StrategySegment[] {
  const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);

  // Séparer passé et futur
  const past = sorted.filter((s) => s.endSec <= fromSec);
  const future = sorted.filter((s) => s.startSec >= fromSec);

  if (future.length === 0) return segments;

  // Calculer le temps restant
  const remainingSec = raceDurationSec - fromSec;

  // Compter pits et runs futurs
  const futurePits = future.filter((s) => s.type === 'PIT');
  const futureRuns = future.filter((s) => s.type === 'RUN');

  const totalPitTime = futurePits.length * pitStopMinDuration;
  const totalRunTime = remainingSec - totalPitTime;

  if (totalRunTime <= 0 || futureRuns.length === 0) return segments;

  const avgRunDuration = Math.floor(totalRunTime / futureRuns.length);
  let currentSec = fromSec;
  let runIndex = 0;

  const rebalanced: StrategySegment[] = [...past];

  for (const seg of future) {
    if (seg.type === 'RUN') {
      const isLast = runIndex === futureRuns.length - 1;
      const duration = isLast
        ? raceDurationSec - currentSec - (futurePits.length - runIndex > 0 ? 0 : 0)
        : avgRunDuration;

      rebalanced.push({
        ...seg,
        startSec: currentSec,
        endSec: currentSec + duration,
        durationSec: duration,
      });
      currentSec += duration;
      runIndex++;
    } else {
      rebalanced.push({
        ...seg,
        startSec: currentSec,
        endSec: currentSec + pitStopMinDuration,
        durationSec: pitStopMinDuration,
      });
      currentSec += pitStopMinDuration;
    }
  }

  return rebalanced;
}
