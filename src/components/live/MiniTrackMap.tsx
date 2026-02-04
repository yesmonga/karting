import { useMemo } from 'react';
import { ApexDriverData } from '@/types/live';

interface MiniTrackMapProps {
    drivers: ApexDriverData[];
    selectedKart: string;
    circuitId?: string;
    width?: number;
    height?: number;
    showLabels?: boolean;
}

// Tracé SVG pour RKC (Racing Kart Cormeilles) - approximation
// Le path représente le circuit, les karts sont positionnés le long de ce path
const CIRCUIT_PATHS: Record<string, { path: string; viewBox: string; name: string }> = {
    'rkc': {
        name: 'Racing Kart Cormeilles',
        viewBox: '0 0 400 250',
        // Tracé approximatif d'un circuit de karting indoor typique
        path: 'M 50,125 C 50,60 100,30 180,30 L 280,30 C 350,30 380,60 380,100 C 380,140 350,160 300,160 L 250,160 C 220,160 200,180 200,200 C 200,230 170,240 120,240 C 70,240 50,210 50,180 Z',
    },
    'wind-circuit': {
        name: 'WindCircuit (Test)',
        viewBox: '0 0 400 250',
        path: 'M 50,125 L 100,50 L 300,50 L 350,100 L 350,150 L 300,200 L 100,200 L 50,150 Z',
    },
    'default': {
        name: 'Circuit',
        viewBox: '0 0 400 250',
        // Ovale simple par défaut
        path: 'M 100,125 C 100,60 150,30 200,30 L 200,30 C 250,30 300,60 300,125 C 300,190 250,220 200,220 L 200,220 C 150,220 100,190 100,125 Z',
    },
};

/**
 * Calcule la position d'un kart sur le tracé en fonction de son avancement
 * L'avancement est estimé à partir des secteurs (S1, S2, S3)
 */
function calculateTrackProgress(driver: ApexDriverData): number {
    // Si on a les temps secteurs, on peut estimer la position
    const s1 = driver.s1 && driver.s1 !== '-' ? 1 : 0;
    const s2 = driver.s2 && driver.s2 !== '-' ? 1 : 0;
    const s3 = driver.s3 && driver.s3 !== '-' ? 1 : 0;

    // Chaque secteur = ~33% du tour
    // On ajoute un peu de variation basée sur la position pour éviter les superpositions
    const baseProgress = (s1 * 0.33 + s2 * 0.33 + s3 * 0.34);

    // Ajouter une variation basée sur le numéro de kart pour espacer les karts
    const kartNum = parseInt(driver.kart) || 0;
    const variation = (kartNum % 10) * 0.02;

    return Math.min(1, baseProgress + variation);
}

/**
 * Obtient un point sur un path SVG à un pourcentage donné
 */
function getPointOnPath(pathElement: SVGPathElement | null, percentage: number): { x: number; y: number } {
    if (!pathElement) return { x: 0, y: 0 };

    const length = pathElement.getTotalLength();
    const point = pathElement.getPointAtLength(length * percentage);
    return { x: point.x, y: point.y };
}

/**
 * Génère une couleur basée sur la position
 */
function getPositionColor(position: number, isSelected: boolean): string {
    if (isSelected) return '#22c55e'; // Vert pour notre kart
    if (position === 1) return '#fbbf24'; // Or pour P1
    if (position === 2) return '#94a3b8'; // Argent pour P2
    if (position === 3) return '#cd7f32'; // Bronze pour P3
    return '#64748b'; // Gris pour les autres
}

export function MiniTrackMap({
    drivers,
    selectedKart,
    circuitId = 'default',
    width = 200,
    height = 125,
    showLabels = true,
}: MiniTrackMapProps) {
    const circuit = CIRCUIT_PATHS[circuitId] || CIRCUIT_PATHS['default'];

    // Calculer les positions des karts
    const kartPositions = useMemo(() => {
        return drivers.map((driver, index) => {
            const progress = calculateTrackProgress(driver);
            const position = parseInt(driver.position) || index + 1;
            const isSelected = driver.kart === selectedKart;

            return {
                kart: driver.kart,
                team: driver.team,
                progress,
                position,
                isSelected,
                color: getPositionColor(position, isSelected),
                onTrack: driver.onTrack === 'true' || driver.onTrack === '1',
            };
        }).filter(k => k.onTrack); // Ne montrer que les karts en piste
    }, [drivers, selectedKart]);

    // Trouver notre kart pour le mettre en évidence
    const myKart = kartPositions.find(k => k.isSelected);

    return (
        <div className="relative bg-card/30 rounded-lg p-2 border border-border/30">
            <svg
                viewBox={circuit.viewBox}
                width={width}
                height={height}
                className="w-full h-auto"
            >
                {/* Fond du circuit */}
                <defs>
                    <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                </defs>

                {/* Tracé du circuit - bordure extérieure */}
                <path
                    d={circuit.path}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Tracé du circuit - piste */}
                <path
                    id="trackPath"
                    d={circuit.path}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Ligne de départ/arrivée */}
                <line
                    x1="50"
                    y1="115"
                    x2="50"
                    y2="135"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray="4,4"
                />

                {/* Karts sur le circuit */}
                {kartPositions.map((kart, index) => {
                    // Calculer la position sur le path
                    // On utilise une approximation basée sur le pourcentage
                    const angle = kart.progress * 2 * Math.PI - Math.PI / 2;
                    const centerX = 200;
                    const centerY = 125;
                    const radiusX = 140;
                    const radiusY = 80;

                    // Position approximative sur une ellipse (simplifié)
                    const x = centerX + radiusX * Math.cos(angle + (index * 0.1));
                    const y = centerY + radiusY * Math.sin(angle + (index * 0.1));

                    return (
                        <g key={kart.kart}>
                            {/* Cercle du kart */}
                            <circle
                                cx={x}
                                cy={y}
                                r={kart.isSelected ? 10 : 7}
                                fill={kart.color}
                                stroke={kart.isSelected ? '#ffffff' : 'transparent'}
                                strokeWidth={kart.isSelected ? 2 : 0}
                                className={kart.isSelected ? 'animate-pulse' : ''}
                            />

                            {/* Numéro du kart */}
                            {showLabels && (
                                <text
                                    x={x}
                                    y={y + 1}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#ffffff"
                                    fontSize={kart.isSelected ? 8 : 6}
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                >
                                    {kart.kart}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Légende */}
            <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[10px] text-muted-foreground">{circuit.name}</span>
                <div className="flex items-center gap-2 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">#{selectedKart}</span>
                    </div>
                    <span className="text-muted-foreground">
                        {kartPositions.length} en piste
                    </span>
                </div>
            </div>

            {/* Position actuelle */}
            {myKart && (
                <div className="absolute top-2 right-2 bg-green-500/20 px-2 py-0.5 rounded text-[10px] font-racing text-green-400">
                    P{myKart.position}
                </div>
            )}
        </div>
    );
}
