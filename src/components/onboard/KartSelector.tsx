import { ApexDriverData } from '@/types/live';
import { Car, Loader2 } from 'lucide-react';

interface KartSelectorProps {
  drivers: ApexDriverData[];
  onSelect: (kart: string) => void;
  circuitId: string;
  loading?: boolean;
}

export function KartSelector({ drivers, onSelect, circuitId, loading }: KartSelectorProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-racing text-white text-center mb-6">
          Sélectionner votre Kart
        </h1>
        <p className="text-muted-foreground text-center mb-6">
          Circuit: {circuitId}
        </p>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement des karts...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {drivers.map((driver) => (
              <button
                key={driver.kart}
                onClick={() => onSelect(driver.kart)}
                className="p-4 bg-black/50 rounded-lg border border-primary/30 hover:border-primary hover:bg-primary/20 transition-all flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  <span className="text-white font-bold text-lg">#{driver.kart}</span>
                </div>
                <span className="text-xs text-muted-foreground bg-primary/20 px-2 py-0.5 rounded">
                  P{driver.position}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-full">
                  {driver.team}
                </span>
              </button>
            ))}
          </div>
        )}

        {!loading && drivers.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            Aucun kart trouvé. Vérifiez que la session est active.
          </div>
        )}
      </div>
    </div>
  );
}
