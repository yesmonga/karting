// Mock Race Data - Course fictive pour tests
// Notre équipe DNF KART en P2 avec 3 pilotes

import { ApexDriverData, ApexLiveData } from '@/types/live';
import { TeamDetails } from '@/hooks/useTeamDetails';

// ============ CONFIGURATION ============

export const MOCK_CONFIG = {
  enabled: false, // Activer/désactiver le mode mock (true = bypass setup)
  ourKart: '25',
  ourTeam: 'DNF KART TEAM',
  raceDurationMs: 4 * 60 * 60 * 1000, // 4 heures
  raceStartTime: Date.now() - (2 * 60 * 60 * 1000), // Commencée il y a 2h
  circuitId: 'windcircuit',
  circuitName: 'WindCircuit Indoor',
  sessionName: 'Endurance 4H - Test',
  raceName: '4H WindCircuit Endurance',
  ballastTarget: 85,
  pitStopsRequired: 5,
  pitStopMinDuration: 120,
};

// ============ NOS PILOTES ============

export const OUR_DRIVERS = [
  { id: 'alex', name: 'ALEX', code: 'A', color: '#F59E0B', weightKg: 75 },
  { id: 'evan', name: 'EVAN', code: 'E', color: '#EF4444', weightKg: 68 },
  { id: 'enzo', name: 'ENZO', code: 'Z', color: '#3B82F6', weightKg: 72 },
];

// Pilote actuellement en piste
export const CURRENT_DRIVER = OUR_DRIVERS[0]; // ALEX

// ============ CLASSEMENT FICTIF (10 équipes) ============

const BASE_LAP_TIME = 66.5; // 1:06.500 en secondes

function generateSectorTime(base: number, variance: number = 0.5): string {
  const time = base + (Math.random() - 0.5) * variance;
  return time.toFixed(3);
}

function generateLapTime(baseSeconds: number): string {
  const variance = (Math.random() - 0.5) * 2; // +/- 1 seconde
  const total = baseSeconds + variance;
  const mins = Math.floor(total / 60);
  const secs = (total % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

function generateGap(position: number, baseGapPerPos: number = 3.5): string {
  if (position === 1) return '';
  const gap = (position - 1) * baseGapPerPos + (Math.random() - 0.5) * 2;
  return `+${gap.toFixed(3)}`;
}

// Config de course mock pour LiveAnalysis
export function getMockRaceConfig() {
  return {
    raceName: MOCK_CONFIG.raceName,
    ballastTarget: MOCK_CONFIG.ballastTarget,
    raceDurationMinutes: MOCK_CONFIG.raceDurationMs / 60000,
    pitStopsRequired: MOCK_CONFIG.pitStopsRequired,
    pitStopMinDuration: MOCK_CONFIG.pitStopMinDuration,
    circuitId: MOCK_CONFIG.circuitId,
    drivers: OUR_DRIVERS.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      color: d.color,
      weightKg: d.weightKg,
    })),
  };
}

function generateInterval(position: number): string {
  if (position === 1) return '';
  const interval = 1.5 + Math.random() * 3;
  return `+${interval.toFixed(3)}`;
}

// Génère les données des 10 équipes
export function generateMockDrivers(): ApexDriverData[] {
  const teams = [
    { kart: '42', team: 'SPEED MASTERS', skill: 0.98 },
    { kart: '25', team: 'DNF KART TEAM', skill: 0.97 },  // NOUS - P2
    { kart: '18', team: 'RACING LEGENDS', skill: 0.96 },
    { kart: '33', team: 'KART ATTACK', skill: 0.95 },
    { kart: '7', team: 'FAST & FURIOUS', skill: 0.94 },
    { kart: '51', team: 'POLE POSITION', skill: 0.93 },
    { kart: '12', team: 'CIRCUIT KINGS', skill: 0.92 },
    { kart: '88', team: 'TURBO TEAM', skill: 0.91 },
    { kart: '3', team: 'KARTING CLUB', skill: 0.90 },
    { kart: '66', team: 'ENDURANCE PRO', skill: 0.89 },
  ];

  const baseLaps = 85; // Tours effectués

  return teams.map((t, index) => {
    const position = index + 1;
    const lapTimeBase = BASE_LAP_TIME / t.skill;
    const isUs = t.kart === MOCK_CONFIG.ourKart;
    
    // Secteurs avec indicateurs de performance
    const s1Base = 24.0 + (1 - t.skill) * 2;
    const s2Base = 20.0 + (1 - t.skill) * 1.5;
    const s3Base = 22.5 + (1 - t.skill) * 2;
    
    let s1 = generateSectorTime(s1Base);
    let s2 = generateSectorTime(s2Base);
    let s3 = generateSectorTime(s3Base);
    
    // Ajouter des indicateurs visuels (violet = meilleur absolu, vert = meilleur perso)
    if (isUs) {
      if (Math.random() > 0.7) s1 = '🟢' + s1;
      if (Math.random() > 0.8) s2 = '🟣' + s2;
    }

    return {
      driverId: `driver-${t.kart}`,
      position: position.toString(),
      kart: t.kart,
      team: t.team,
      s1,
      s2,
      s3,
      lastLap: generateLapTime(lapTimeBase),
      bestLap: generateLapTime(lapTimeBase - 0.8),
      gap: generateGap(position),
      interval: generateInterval(position),
      laps: (baseLaps - index).toString(),
      onTrack: isUs ? '0:45' : (Math.random() > 0.1 ? '1:20' : ''),
      pits: Math.floor(2 + Math.random() * 2).toString(),
      penalty: '',
    };
  });
}

// ============ DONNÉES LIVE COMPLÈTES ============

let mockDriversCache: ApexDriverData[] | null = null;
let lastUpdateTime = 0;

export function getMockLiveData(): ApexLiveData {
  const now = Date.now();
  
  // Mettre à jour les données toutes les 2 secondes
  if (!mockDriversCache || now - lastUpdateTime > 2000) {
    mockDriversCache = generateMockDrivers();
    lastUpdateTime = now;
  }

  const elapsed = now - MOCK_CONFIG.raceStartTime;
  const remaining = Math.max(0, MOCK_CONFIG.raceDurationMs - elapsed);

  return {
    circuit: MOCK_CONFIG.circuitName,
    session: MOCK_CONFIG.sessionName,
    status: 'CONNECTED',
    timestamp: new Date().toISOString(),
    drivers: mockDriversCache,
    comments: [
      { time: '2:00:15', kart: '42', text: 'Meilleur tour en course!' },
      { time: '1:58:30', kart: '25', text: 'Pit stop effectué - 45s' },
      { time: '1:55:00', kart: '18', text: 'Pénalité drive-through' },
    ],
    raceTimeRemaining: remaining,
  };
}

// ============ DÉTAILS DE NOTRE ÉQUIPE ============

export function getMockTeamDetails(): TeamDetails {
  const laps = [];
  for (let i = 1; i <= 85; i++) {
    const s1 = 23800 + Math.random() * 1500;
    const s2 = 19800 + Math.random() * 1200;
    const s3 = 22200 + Math.random() * 1500;
    laps.push({
      lapNumber: i,
      s1,
      s2,
      s3,
      total: s1 + s2 + s3,
      s1Best: Math.random() > 0.9,
      s2Best: Math.random() > 0.9,
      s3Best: Math.random() > 0.9,
      totalBest: Math.random() > 0.95,
      isPit: i % 25 === 0,
    });
  }

  return {
    teamId: 'team-25',
    teamName: MOCK_CONFIG.ourTeam,
    kartNumber: MOCK_CONFIG.ourKart,
    club: 'DNF Racing',
    color: '#EF4444',
    currentLap: 85,
    currentDriver: {
      id: CURRENT_DRIVER.id,
      num: '1',
      name: CURRENT_DRIVER.name,
      isCurrent: true,
    },
    drivers: OUR_DRIVERS.map((d, i) => ({
      id: d.id,
      num: (i + 1).toString(),
      name: d.name,
      isCurrent: d.id === CURRENT_DRIVER.id,
    })),
    laps,
    bestLap: { s1: 23850, s2: 19820, s3: 22180, total: 65850 },
    bestSectors: { s1: 23750, s2: 19780, s3: 22050 },
  };
}

// ============ SYSTÈME DE MESSAGES MOCK (cross-device via API HTTP) ============

type MessageListener = (message: { text: string; timestamp: Date }) => void;

const messageListeners: Set<MessageListener> = new Set();

// Envoyer un message via l'API du serveur Vite
export async function sendMockMessage(text: string): Promise<void> {
  try {
    await fetch('/api/mock-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.error('Erreur envoi message mock:', e);
  }
}

// S'abonner aux messages avec polling sur l'API
export function subscribeMockMessages(listener: MessageListener): () => void {
  messageListeners.add(listener);
  
  let lastMessageId = 0;
  
  // Polling API toutes les 500ms
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/mock-message');
      const data = await res.json();
      if (data && data.id && data.id > lastMessageId) {
        lastMessageId = data.id;
        listener({
          text: data.text,
          timestamp: new Date(data.timestamp),
        });
      }
    } catch (e) {
      // Ignore fetch errors
    }
  }, 500);
  
  return () => {
    messageListeners.delete(listener);
    clearInterval(pollInterval);
  };
}

// Récupérer le message actuel
export async function getCurrentMockMessage(): Promise<{ text: string; timestamp: Date } | null> {
  try {
    const res = await fetch('/api/mock-message');
    const data = await res.json();
    if (data && data.text) {
      return {
        text: data.text,
        timestamp: new Date(data.timestamp),
      };
    }
  } catch (e) {
    // Ignore
  }
  return null;
}
