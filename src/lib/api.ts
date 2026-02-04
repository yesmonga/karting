// API Client - replaces Supabase SDK
const API_BASE = '/api';

// Generic fetch wrapper with error handling
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || 'API Error');
    }

    return response.json();
}

// ============== TEAMS ==============

export interface Team {
    id: string;
    name: string;
    user_id?: string;
    created_at: string;
}

export const teams = {
    getAll: () => apiFetch<Team[]>('/teams'),
    create: (name: string, user_id?: string) =>
        apiFetch<Team>('/teams', { method: 'POST', body: JSON.stringify({ name, user_id }) }),
};

// ============== DRIVERS ==============

export interface Driver {
    id: string;
    team_id: string;
    name: string;
    full_name?: string;
    code: string;
    color: string;
    weight_kg?: number;
    created_at: string;
}

export const drivers = {
    getAll: () => apiFetch<Driver[]>('/drivers'),
    create: (data: Partial<Driver>) =>
        apiFetch<Driver>('/drivers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Driver>) =>
        apiFetch<Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        apiFetch<void>(`/drivers/${id}`, { method: 'DELETE' }),
};

// ============== RACES ==============

export interface Race {
    id: string;
    team_id: string;
    name: string;
    date?: string;
    track_name?: string;
    ballast_target_kg: number;
    kart_number?: number;
    position?: number;
    total_karts?: number;
    best_lap_ms?: number;
    best_lap_number?: number;
    total_laps?: number;
    created_at: string;
    team_name?: string;
}

export interface RaceLap {
    id: string;
    race_id: string;
    lap_number: number;
    lap_time_ms: number;
}

export interface PitStop {
    id: string;
    race_id: string;
    lap_number: number;
    duration_ms?: number;
}

export interface Stint {
    id: string;
    race_id: string;
    driver_id?: string;
    stint_number: number;
    start_lap: number;
    end_lap: number;
    best_lap_ms?: number;
    avg_lap_ms?: number;
    total_laps?: number;
}

export interface RaceWithDetails extends Race {
    laps: RaceLap[];
    pit_stops: PitStop[];
    stints: Stint[];
}

export const races = {
    getAll: () => apiFetch<Race[]>('/races'),
    getById: (id: string) => apiFetch<RaceWithDetails>(`/races/${id}`),
    create: (data: Partial<Race> & { laps?: any[]; pit_stops?: any[]; stints?: any[] }) =>
        apiFetch<Race>('/races', { method: 'POST', body: JSON.stringify(data) }),
};

// ============== LIVE SESSIONS ==============

export interface LiveSession {
    id: string;
    user_id: string;
    circuit_id: string;
    config: any;
    selected_kart: string;
    selected_team: string;
    stints?: any;
    race_start_time?: number;
    created_at: string;
    updated_at: string;
}

export const liveSessions = {
    getById: (id: string) => apiFetch<LiveSession | null>(`/live-sessions/${id}`),
    getByUser: (userId: string) => apiFetch<LiveSession | null>(`/live-sessions/user/${userId}`),
    save: (data: Partial<LiveSession>) =>
        apiFetch<LiveSession>('/live-sessions', { method: 'POST', body: JSON.stringify(data) }),
    updateStints: (id: string, stints: any) =>
        apiFetch<LiveSession>(`/live-sessions/${id}/stints`, { method: 'PATCH', body: JSON.stringify({ stints }) }),
};

// ============== ONBOARD MESSAGES ==============

export interface OnboardMessage {
    id: string;
    session_id?: string;
    kart_number: string;
    text: string;
    created_at: string;
}

export const onboardMessages = {
    create: (data: { session_id?: string; kart_number: string; text: string }) =>
        apiFetch<OnboardMessage>('/onboard-messages', { method: 'POST', body: JSON.stringify(data) }),
    getBySession: (sessionId: string) =>
        apiFetch<OnboardMessage[]>(`/onboard-messages/${sessionId}`),
};

// ============== APEX TIMING ==============

export interface ApexDriver {
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
    text: string;
    kart?: string;
}

export interface ApexLiveData {
    circuit: string;
    session: string;
    timestamp: string;
    drivers: ApexDriver[];
    comments: ApexComment[];
    raceTimeRemaining: number;
    status: 'CONNECTING' | 'CONNECTED' | 'TIMEOUT' | 'ERROR' | 'NO_DATA';
}

export interface ApexLapData {
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

export interface ApexDriverInfo {
    id: string;
    num: string;
    name: string;
    isCurrent: boolean;
}

export interface ApexTeamDetails {
    teamId: string;
    teamName: string;
    kartNumber: string;
    club: string;
    color: string;
    currentLap: number;
    currentDriver: ApexDriverInfo | null;
    drivers: ApexDriverInfo[];
    laps: ApexLapData[];
    bestLap: { s1: number; s2: number; s3: number; total: number };
    bestSectors: { s1: number; s2: number; s3: number };
}

export const apex = {
    getLiveData: (circuitId: string, sessionId?: string) =>
        apiFetch<ApexLiveData>('/apex/live', { method: 'POST', body: JSON.stringify({ circuitId, sessionId }) }),
    getTeamDetails: (circuitId: string, driverId: string) =>
        apiFetch<ApexTeamDetails>('/apex/team-details', { method: 'POST', body: JSON.stringify({ circuitId, driverId }) }),
};

// Default export for convenience
export default {
    teams,
    drivers,
    races,
    liveSessions,
    onboardMessages,
    apex,
};
