/**
 * Utilitaires d'analyse en temps réel pour le Race Engineer
 * Inclut l'analyse des concurrents (Devant/Derrière) pour conseils tactiques
 */

import { ApexDriverData, ApexLiveData } from '@/types/live';

// ============ ENGINEER ADVICE TYPES ============

export type EngineerStatus = 'GREEN' | 'ORANGE' | 'RED';
export type EngineerAction = 'STAY_OUT' | 'BOX_NOW' | 'YIELD_POSITION' | 'PUSH' | 'DEFEND';

export interface CompetitorInfo {
  kart: string;
  team: string;
  gap: number; // en secondes, positif = devant, négatif = derrière
  avgLapTime: number;
  lastLapTime: number;
  paceDelta: number; // différence de rythme vs nous (positif = plus lent)
  position: number;
}

export interface EngineerAdvice {
  status: EngineerStatus;
  message: string;
  details: string;
  action: EngineerAction;
  carAhead?: CompetitorInfo;
  carBehind?: CompetitorInfo;
  timestamp: number;
}

/**
 * Parse un temps au format "mm:ss.xxx" ou "ss.xxx" en secondes
 */
function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr || timeStr === '-' || timeStr === '') return 0;
  
  // Format "mm:ss.xxx"
  if (timeStr.includes(':')) {
    const [mins, rest] = timeStr.split(':');
    const secs = parseFloat(rest);
    return parseInt(mins) * 60 + secs;
  }
  
  // Format "ss.xxx" ou juste un nombre
  return parseFloat(timeStr) || 0;
}

/**
 * Parse un gap/interval au format "+1.234" ou "-1.234" ou "1 LAP" en secondes
 */
function parseGapToSeconds(gapStr: string): number {
  if (!gapStr || gapStr === '-' || gapStr === '') return 0;
  
  // Si c'est un tour de retard/avance
  if (gapStr.includes('LAP')) {
    const laps = parseInt(gapStr) || 1;
    return laps * 60; // Approximation: 1 tour = 60s
  }
  
  // Enlever le + si présent
  const cleaned = gapStr.replace('+', '');
  return parseFloat(cleaned) || 0;
}

/**
 * Trouve le concurrent directement devant notre kart
 */
function findCarAhead(
  drivers: ApexDriverData[],
  myKart: string,
  myPosition: number
): CompetitorInfo | undefined {
  if (myPosition <= 1) return undefined;
  
  const carAhead = drivers.find(d => parseInt(d.position) === myPosition - 1);
  if (!carAhead) return undefined;
  
  const myDriver = drivers.find(d => d.kart === myKart);
  if (!myDriver) return undefined;
  
  const myAvgLap = parseTimeToSeconds(myDriver.lastLap);
  const aheadAvgLap = parseTimeToSeconds(carAhead.lastLap);
  
  return {
    kart: carAhead.kart,
    team: carAhead.team,
    gap: parseGapToSeconds(myDriver.interval), // Interval = écart avec celui devant
    avgLapTime: aheadAvgLap,
    lastLapTime: aheadAvgLap,
    paceDelta: aheadAvgLap - myAvgLap, // Positif = il est plus lent
    position: parseInt(carAhead.position),
  };
}

/**
 * Trouve le concurrent directement derrière notre kart
 */
function findCarBehind(
  drivers: ApexDriverData[],
  myKart: string,
  myPosition: number,
  totalDrivers: number
): CompetitorInfo | undefined {
  if (myPosition >= totalDrivers) return undefined;
  
  const carBehind = drivers.find(d => parseInt(d.position) === myPosition + 1);
  if (!carBehind) return undefined;
  
  const myDriver = drivers.find(d => d.kart === myKart);
  if (!myDriver) return undefined;
  
  const myAvgLap = parseTimeToSeconds(myDriver.lastLap);
  const behindAvgLap = parseTimeToSeconds(carBehind.lastLap);
  
  return {
    kart: carBehind.kart,
    team: carBehind.team,
    gap: -parseGapToSeconds(carBehind.interval), // Négatif car derrière
    avgLapTime: behindAvgLap,
    lastLapTime: behindAvgLap,
    paceDelta: behindAvgLap - myAvgLap, // Négatif = il est plus rapide
    position: parseInt(carBehind.position),
  };
}

/**
 * FONCTION PRINCIPALE: Analyse la situation et génère un conseil d'ingénieur
 * 
 * @param liveData - Données live de la course
 * @param myKart - Numéro de notre kart
 * @param isPitWindowOpen - La fenêtre de pit est-elle ouverte?
 * @returns Conseil de l'ingénieur avec action recommandée
 */
export function getRaceEngineerAdvice(
  liveData: ApexLiveData | null,
  myKart: string,
  isPitWindowOpen: boolean = true
): EngineerAdvice {
  const defaultAdvice: EngineerAdvice = {
    status: 'GREEN',
    message: 'Situation normale',
    details: 'Continuez votre rythme',
    action: 'STAY_OUT',
    timestamp: Date.now(),
  };

  // Pas de données = pas de conseil
  if (!liveData || !liveData.drivers || liveData.drivers.length === 0) {
    return {
      ...defaultAdvice,
      message: 'En attente de données...',
      details: 'Connexion en cours',
    };
  }

  // Trouver notre kart
  const myDriver = liveData.drivers.find(d => d.kart === myKart);
  if (!myDriver) {
    return {
      ...defaultAdvice,
      message: 'Kart non trouvé',
      details: `Kart #${myKart} non détecté sur la piste`,
    };
  }

  const myPosition = parseInt(myDriver.position);
  const totalDrivers = liveData.drivers.length;
  const myLaps = parseInt(myDriver.laps) || 0;

  // Premier tour = pas assez de données
  if (myLaps < 2) {
    return {
      ...defaultAdvice,
      message: 'Début de course',
      details: 'Collecte des données en cours...',
    };
  }

  // Analyser les concurrents
  const carAhead = findCarAhead(liveData.drivers, myKart, myPosition);
  const carBehind = findCarBehind(liveData.drivers, myKart, myPosition, totalDrivers);

  // ============ LOGIQUE DE DÉCISION ============

  // PRIORITÉ 1: Trafic rapide derrière (Blue Flag scenario)
  if (carBehind && carBehind.gap > -0.8 && carBehind.paceDelta < -0.5) {
    return {
      status: 'ORANGE',
      message: '🏎️ TRAFIC RAPIDE DERRIÈRE',
      details: `Kart #${carBehind.kart} est ${Math.abs(carBehind.paceDelta).toFixed(1)}s/tour plus rapide. Ne défendez pas, laissez passer pour prendre l'aspiration!`,
      action: 'YIELD_POSITION',
      carAhead,
      carBehind,
      timestamp: Date.now(),
    };
  }

  // PRIORITÉ 2: Dirty Air - Bloqué derrière un plus lent
  if (carAhead && carAhead.gap < 1.5 && carAhead.paceDelta > 0.3) {
    // On est plus rapide mais on n'arrive pas à passer
    if (isPitWindowOpen) {
      return {
        status: 'RED',
        message: '⚠️ DIRTY AIR - UNDERCUT RECOMMANDÉ',
        details: `Bloqué derrière Kart #${carAhead.kart} (${carAhead.paceDelta.toFixed(1)}s/tour plus lent). Perte de temps en air sale. BOX NOW pour undercut!`,
        action: 'BOX_NOW',
        carAhead,
        carBehind,
        timestamp: Date.now(),
      };
    } else {
      return {
        status: 'ORANGE',
        message: '⚠️ DIRTY AIR DÉTECTÉ',
        details: `Bloqué derrière Kart #${carAhead.kart} (${carAhead.paceDelta.toFixed(1)}s/tour plus lent). Fenêtre pit fermée - cherchez une ouverture.`,
        action: 'PUSH',
        carAhead,
        carBehind,
        timestamp: Date.now(),
      };
    }
  }

  // PRIORITÉ 3: Menace derrière - défense nécessaire
  if (carBehind && carBehind.gap > -0.5 && carBehind.paceDelta > -0.3 && carBehind.paceDelta < 0.3) {
    // Rythme similaire, il est proche
    return {
      status: 'ORANGE',
      message: '🛡️ PRESSION DERRIÈRE',
      details: `Kart #${carBehind.kart} à ${Math.abs(carBehind.gap).toFixed(1)}s. Rythme similaire - défendez votre position!`,
      action: 'DEFEND',
      carAhead,
      carBehind,
      timestamp: Date.now(),
    };
  }

  // PRIORITÉ 4: Opportunité d'attaque
  if (carAhead && carAhead.gap < 2.0 && carAhead.paceDelta > 0) {
    return {
      status: 'GREEN',
      message: '🎯 OPPORTUNITÉ DEVANT',
      details: `Kart #${carAhead.kart} à ${carAhead.gap.toFixed(1)}s, ${carAhead.paceDelta.toFixed(1)}s/tour plus lent. Poussez pour le dépassement!`,
      action: 'PUSH',
      carAhead,
      carBehind,
      timestamp: Date.now(),
    };
  }

  // PRIORITÉ 5: Piste claire
  if (!carAhead || carAhead.gap > 3.0) {
    if (!carBehind || carBehind.gap < -3.0) {
      return {
        status: 'GREEN',
        message: '🟢 PISTE CLAIRE',
        details: 'Aucun trafic proche. Maintenez votre rythme optimal.',
        action: 'STAY_OUT',
        carAhead,
        carBehind,
        timestamp: Date.now(),
      };
    }
  }

  // Situation normale
  return {
    ...defaultAdvice,
    carAhead,
    carBehind,
  };
}

export type TrafficStatus = 'CLEAN_AIR' | 'NORMAL' | 'TRAFFIC_DETECTED';

export interface TrafficAnalysis {
  status: TrafficStatus;
  avgLast3Laps: number;
  bestLapTime: number;
  delta: number;
  recommendation?: string;
}

/**
 * Analyse l'état du trafic basé sur les temps au tour récents
 * 
 * @param recentLapTimes - Tableau des derniers temps au tour en secondes
 * @param bestLapTime - Meilleur temps au tour en secondes
 * @returns Analyse du trafic avec statut et recommandation
 */
export function analyzeTrafficState(
  recentLapTimes: number[],
  bestLapTime: number
): TrafficAnalysis {
  if (recentLapTimes.length === 0 || bestLapTime <= 0) {
    return {
      status: 'NORMAL',
      avgLast3Laps: 0,
      bestLapTime,
      delta: 0,
    };
  }

  // Prendre les 3 derniers tours (ou moins si pas assez)
  const last3 = recentLapTimes.slice(-3);
  const avgLast3Laps = last3.reduce((sum, t) => sum + t, 0) / last3.length;
  const delta = avgLast3Laps - bestLapTime;

  let status: TrafficStatus;
  let recommendation: string | undefined;

  if (delta > 1.5) {
    // Plus de 1.5s de perte = trafic détecté
    status = 'TRAFFIC_DETECTED';
    recommendation = 'Trafic détecté - Considérer un undercut';
  } else if (delta < 0.5) {
    // Moins de 0.5s de perte = piste claire
    status = 'CLEAN_AIR';
    recommendation = 'Piste claire - Continuer le stint';
  } else {
    status = 'NORMAL';
  }

  return {
    status,
    avgLast3Laps,
    bestLapTime,
    delta,
    recommendation,
  };
}

/**
 * Détermine si la fenêtre de pit est ouverte
 * 
 * @param currentTimeSec - Temps actuel de course en secondes
 * @param raceDurationSec - Durée totale de course en secondes
 * @param pitsCompleted - Nombre de pits déjà effectués
 * @param pitsRequired - Nombre de pits obligatoires
 * @returns true si on peut piter maintenant
 */
export function isPitWindowOpen(
  currentTimeSec: number,
  raceDurationSec: number,
  pitsCompleted: number,
  pitsRequired: number
): boolean {
  const pitsRemaining = pitsRequired - pitsCompleted;
  if (pitsRemaining <= 0) return false;

  // Temps restant
  const remainingSec = raceDurationSec - currentTimeSec;
  
  // Temps minimum nécessaire pour les pits restants (60s chacun + marge)
  const minTimeForPits = pitsRemaining * 120; // 2 min par pit restant
  
  // Fenêtre ouverte si on a assez de temps
  return remainingSec > minTimeForPits;
}

/**
 * Calcule le temps optimal pour le prochain pit
 * 
 * @param currentTimeSec - Temps actuel
 * @param raceDurationSec - Durée totale
 * @param pitsCompleted - Pits effectués
 * @param pitsRequired - Pits obligatoires
 * @returns Temps optimal en secondes depuis le début
 */
export function calculateOptimalPitTime(
  currentTimeSec: number,
  raceDurationSec: number,
  pitsCompleted: number,
  pitsRequired: number
): number | null {
  const pitsRemaining = pitsRequired - pitsCompleted;
  if (pitsRemaining <= 0) return null;

  const remainingSec = raceDurationSec - currentTimeSec;
  const stintsRemaining = pitsRemaining + 1;
  const avgStintDuration = remainingSec / stintsRemaining;

  return currentTimeSec + avgStintDuration;
}

/**
 * Analyse la performance du stint actuel
 */
export interface StintPerformance {
  lapsCompleted: number;
  avgLapTime: number;
  consistency: number; // 0-100, 100 = très consistant
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
}

export function analyzeStintPerformance(
  lapTimes: number[]
): StintPerformance {
  if (lapTimes.length === 0) {
    return {
      lapsCompleted: 0,
      avgLapTime: 0,
      consistency: 100,
      trend: 'STABLE',
    };
  }

  const lapsCompleted = lapTimes.length;
  const avgLapTime = lapTimes.reduce((sum, t) => sum + t, 0) / lapsCompleted;

  // Calculer l'écart-type pour la consistance
  const variance = lapTimes.reduce((sum, t) => sum + Math.pow(t - avgLapTime, 2), 0) / lapsCompleted;
  const stdDev = Math.sqrt(variance);
  
  // Consistance: 100 si stdDev = 0, diminue avec l'écart-type
  const consistency = Math.max(0, Math.min(100, 100 - (stdDev * 20)));

  // Tendance: comparer première et dernière moitié
  let trend: 'IMPROVING' | 'STABLE' | 'DEGRADING' = 'STABLE';
  if (lapsCompleted >= 4) {
    const half = Math.floor(lapsCompleted / 2);
    const firstHalf = lapTimes.slice(0, half);
    const secondHalf = lapTimes.slice(half);
    
    const avgFirst = firstHalf.reduce((sum, t) => sum + t, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, t) => sum + t, 0) / secondHalf.length;
    
    const diff = avgSecond - avgFirst;
    if (diff < -0.3) {
      trend = 'IMPROVING';
    } else if (diff > 0.5) {
      trend = 'DEGRADING';
    }
  }

  return {
    lapsCompleted,
    avgLapTime,
    consistency,
    trend,
  };
}

/**
 * Génère une recommandation de stratégie basée sur l'état actuel
 */
export interface StrategyRecommendation {
  action: 'STAY_OUT' | 'BOX_NOW' | 'BOX_NEXT_LAP' | 'CONSIDER_BOX';
  reason: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function getStrategyRecommendation(
  trafficAnalysis: TrafficAnalysis,
  isPitOpen: boolean,
  stintPerformance: StintPerformance,
  pitsRemaining: number
): StrategyRecommendation {
  // Pas de pits restants = rester en piste
  if (pitsRemaining <= 0) {
    return {
      action: 'STAY_OUT',
      reason: 'Tous les arrêts effectués',
      urgency: 'LOW',
    };
  }

  // Fenêtre fermée = rester en piste
  if (!isPitOpen) {
    return {
      action: 'STAY_OUT',
      reason: 'Fenêtre de pit fermée',
      urgency: 'LOW',
    };
  }

  // Trafic détecté + fenêtre ouverte = considérer undercut
  if (trafficAnalysis.status === 'TRAFFIC_DETECTED') {
    return {
      action: 'CONSIDER_BOX',
      reason: `Trafic détecté (+${trafficAnalysis.delta.toFixed(1)}s/tour)`,
      urgency: 'HIGH',
    };
  }

  // Performance dégradée = considérer pit
  if (stintPerformance.trend === 'DEGRADING' && stintPerformance.lapsCompleted > 5) {
    return {
      action: 'CONSIDER_BOX',
      reason: 'Performance en baisse',
      urgency: 'MEDIUM',
    };
  }

  // Piste claire = rester en piste
  if (trafficAnalysis.status === 'CLEAN_AIR') {
    return {
      action: 'STAY_OUT',
      reason: 'Piste claire, continuer',
      urgency: 'LOW',
    };
  }

  return {
    action: 'STAY_OUT',
    reason: 'Situation normale',
    urgency: 'LOW',
  };
}
