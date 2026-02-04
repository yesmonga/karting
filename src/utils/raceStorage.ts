// Race storage utilities using localStorage

import { ImportedRace } from '@/types/race';

const STORAGE_KEY = 'dnf_kart_races';
const DRIVERS_KEY = 'dnf_kart_drivers';

export function getAllRaces(): ImportedRace[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getRaceById(id: string): ImportedRace | null {
  const races = getAllRaces();
  return races.find(r => r.id === id) || null;
}

export function saveRace(race: ImportedRace): void {
  const races = getAllRaces();
  const existingIndex = races.findIndex(r => r.id === race.id);
  
  if (existingIndex >= 0) {
    races[existingIndex] = race;
  } else {
    races.push(race);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(races));
}

export function deleteRace(id: string): void {
  const races = getAllRaces().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(races));
}

export function generateRaceId(): string {
  return `race_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Team drivers management
export interface SavedDriver {
  name: string;
  fullName: string;
  code: string;
  color: string;
}

export function getSavedDrivers(): SavedDriver[] {
  try {
    const data = localStorage.getItem(DRIVERS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    void e;
  }
  
  // Default drivers
  return [
    { name: 'EVAN', fullName: 'FAURE EVAN', code: 'A', color: '#EF4444' },
    { name: 'ENZO', fullName: 'FRANGER-RITEAU ENZO', code: 'B', color: '#3B82F6' },
    { name: 'IDRISS', fullName: 'ESSAGHIR IDRISS', code: 'C', color: '#10B981' },
    { name: 'ALEX', fullName: 'FAURE ALEX', code: 'D', color: '#F59E0B' },
  ];
}

export function saveDrivers(drivers: SavedDriver[]): void {
  localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
}

// Get all unique drivers from all races
export function getAllDriversFromRaces(): string[] {
  const races = getAllRaces();
  const driversSet = new Set<string>();
  
  races.forEach(race => {
    Object.keys(race.drivers).forEach(d => driversSet.add(d));
  });
  
  return Array.from(driversSet);
}
