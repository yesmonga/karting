import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Scale, Link, Users, Trophy, Flag, Check, Settings, Loader2, Clock } from 'lucide-react';
import { LiveDriver, LiveRaceConfig, StrategySegment, StrategyValidationResult } from '@/types/live';
import { calculateBallast, formatBallast } from '@/utils/ballastCalculator';
import { useDrivers } from '@/hooks/useDrivers';
import { Link as RouterLink } from 'react-router-dom';
import { StrategyBuilder } from '@/components/strategy/StrategyBuilder';

interface LiveSetupProps {
  onSetupComplete: (config: LiveRaceConfig, strategy?: StrategySegment[]) => void;
}

const DRIVER_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

const CIRCUIT_PRESETS = [
  { id: 'rkc', name: 'Racing Kart Cormeilles' },
  { id: 'rko-angerville', name: 'RKO Angerville' },
  { id: 'lemans-karting', name: 'Le Mans Karting' },
  { id: 'paris-kart', name: 'Paris Kart Indoor' },
  { id: 'wind-circuit', name: 'WindCircuit (Test)' },
];

export function LiveSetup({ onSetupComplete }: LiveSetupProps) {
  const [step, setStep] = useState<'race' | 'drivers' | 'connect' | 'strategy'>('race');
  
  // Race config
  const [raceName, setRaceName] = useState('');
  const [ballastTarget, setBallastTarget] = useState(85);
  const [raceDuration] = useState(240);
  const [pitStopsRequired, setPitStopsRequired] = useState(5);
  const [pitStopMinDuration, setPitStopMinDuration] = useState(60);
  
  // Drivers from DB
  const { drivers: dbDrivers, isLoading: driversLoading, createDriver } = useDrivers();
  
  // Selected drivers for this race
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  
  // Quick add form
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverWeight, setNewDriverWeight] = useState(75);
  
  // Circuit selection
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);

  // Strategy
  const [strategySegments, setStrategySegments] = useState<StrategySegment[]>([]);
  const [strategyValidation, setStrategyValidation] = useState<StrategyValidationResult | null>(null);

  const toggleDriverSelection = (id: string) => {
    setSelectedDriverIds(prev => 
      prev.includes(id) 
        ? prev.filter(d => d !== id)
        : [...prev, id]
    );
  };

  const handleQuickAdd = () => {
    if (!newDriverName.trim()) return;
    
    createDriver.mutate({
      name: newDriverName,
      weight_kg: newDriverWeight,
      color: DRIVER_COLORS[dbDrivers.length % DRIVER_COLORS.length],
    }, {
      onSuccess: (newDriver) => {
        setSelectedDriverIds(prev => [...prev, newDriver.id]);
        setNewDriverName('');
        setNewDriverWeight(75);
        setShowQuickAdd(false);
      }
    });
  };

  // Convert DB drivers to LiveDriver format (memoized for strategy builder)
  const selectedLiveDrivers: LiveDriver[] = useMemo(() => {
    return selectedDriverIds
      .map(id => {
        const dbDriver = dbDrivers.find(d => d.id === id);
        if (!dbDriver) return null;
        return {
          id: dbDriver.id,
          name: dbDriver.name,
          code: dbDriver.code,
          color: dbDriver.color,
          weightKg: dbDriver.weight_kg || 75,
        };
      })
      .filter(Boolean) as LiveDriver[];
  }, [selectedDriverIds, dbDrivers]);

  const handleComplete = () => {
    if (!selectedCircuit) return;
    
    const config: LiveRaceConfig = {
      raceName,
      ballastTarget,
      raceDurationMinutes: raceDuration,
      pitStopsRequired,
      pitStopMinDuration,
      circuitId: selectedCircuit,
      drivers: selectedLiveDrivers,
    };
    onSetupComplete(config, strategySegments.length > 0 ? strategySegments : undefined);
  };

  const canProceedFromRace = raceName.trim().length > 0;
  const canProceedFromDrivers = selectedDriverIds.length >= 2;
  const canProceedFromConnect = selectedCircuit !== null;
  const canComplete = selectedCircuit !== null && (strategySegments.length === 0 || strategyValidation?.isValid);

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="font-racing text-3xl md:text-4xl font-bold gradient-text-racing mb-2">
            Configuration Course
          </h1>
          <p className="text-muted-foreground">
            {step === 'race' && 'Paramètres de la course'}
            {step === 'drivers' && 'Sélection des pilotes'}
            {step === 'connect' && 'Connexion Apex Timing'}
            {step === 'strategy' && 'Planification des relais'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['race', 'drivers', 'connect', 'strategy'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center font-racing text-sm transition-all ${
                  step === s 
                    ? 'bg-primary text-primary-foreground glow-red' 
                    : ['race', 'drivers', 'connect', 'strategy'].indexOf(step) > i 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Race Config */}
        {step === 'race' && (
          <Card className="glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="font-racing flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Paramètres de Course
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="raceName" className="flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Nom de la course
                </Label>
                <Input
                  id="raceName"
                  placeholder="Ex: 4H Endurance Lyon"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ballast" className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Poids cible (kg)
                </Label>
                <Input
                  id="ballast"
                  type="number"
                  value={ballastTarget}
                  onChange={(e) => setBallastTarget(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Arrêts obligatoires</Label>
                  <Input
                    type="number"
                    value={pitStopsRequired}
                    onChange={(e) => setPitStopsRequired(Number(e.target.value))}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durée min arrêt (s)</Label>
                  <Input
                    type="number"
                    value={pitStopMinDuration}
                    onChange={(e) => setPitStopMinDuration(Number(e.target.value))}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <Button 
                onClick={() => setStep('drivers')} 
                disabled={!canProceedFromRace}
                className="w-full gradient-racing"
              >
                Suivant: Pilotes
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Drivers */}
        {step === 'drivers' && (
          <Card className="glass-card animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-racing flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Sélection Pilotes
                </CardTitle>
                <RouterLink to="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Gérer
                  </Button>
                </RouterLink>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loading */}
              {driversLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {/* No drivers message */}
              {!driversLoading && dbDrivers.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun pilote enregistré</p>
                  <p className="text-sm mb-4">Créez vos pilotes dans les Paramètres ou ajoutez-en rapidement</p>
                  <RouterLink to="/settings">
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Aller aux Paramètres
                    </Button>
                  </RouterLink>
                </div>
              )}

              {/* Driver List */}
              {!driversLoading && dbDrivers.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dbDrivers.map((driver) => {
                    const isSelected = selectedDriverIds.includes(driver.id);
                    const ballast = calculateBallast(driver.weight_kg || 75, ballastTarget);
                    
                    return (
                      <button
                        key={driver.id}
                        onClick={() => toggleDriverSelection(driver.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                          isSelected 
                            ? 'bg-primary/20 border-2 border-primary' 
                            : 'bg-background/30 border border-border/50 hover:border-primary/30'
                        }`}
                      >
                        <div 
                          className="w-3 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: driver.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-racing font-semibold truncate">{driver.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {driver.weight_kg || 75}kg → {formatBallast(ballast)}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Quick Add Form */}
              {showQuickAdd ? (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        placeholder="Ex: Alex"
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        className="bg-background/50"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Poids (kg)</Label>
                      <Input
                        type="number"
                        value={newDriverWeight}
                        onChange={(e) => setNewDriverWeight(Number(e.target.value))}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowQuickAdd(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleQuickAdd}
                      disabled={!newDriverName.trim() || createDriver.isPending}
                      className="gradient-racing"
                    >
                      {createDriver.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      Créer & Sélectionner
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuickAdd(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un nouveau pilote
                </Button>
              )}

              {/* Selection count */}
              <div className="text-center text-sm text-muted-foreground">
                {selectedDriverIds.length} pilote(s) sélectionné(s)
                {selectedDriverIds.length < 2 && (
                  <span className="text-destructive"> (minimum 2)</span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('race')} className="flex-1">
                  Retour
                </Button>
                <Button 
                  onClick={() => setStep('connect')} 
                  disabled={!canProceedFromDrivers}
                  className="flex-1 gradient-racing"
                >
                  Suivant: Connexion
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Apex Connection */}
        {step === 'connect' && (
          <Card className="glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="font-racing flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Connexion Apex Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Circuit Selection */}
              <div className="space-y-2">
                <Label>Sélectionnez votre circuit</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CIRCUIT_PRESETS.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={selectedCircuit === preset.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCircuit(preset.id)}
                      className={selectedCircuit === preset.id ? 'gradient-racing' : ''}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedCircuit && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                  <p className="text-sm text-green-400">
                    ✓ Circuit sélectionné: {CIRCUIT_PRESETS.find(c => c.id === selectedCircuit)?.name}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('drivers')} className="flex-1">
                  Retour
                </Button>
                <Button 
                  onClick={() => setStep('strategy')} 
                  disabled={!canProceedFromConnect}
                  className="flex-1 gradient-racing"
                >
                  Suivant: Stratégie
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Strategy */}
        {step === 'strategy' && (
          <Card className="glass-card animate-slide-up">
            <CardHeader>
              <CardTitle className="font-racing flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Stratégie de Relais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <StrategyBuilder
                drivers={selectedLiveDrivers}
                raceDurationMinutes={raceDuration}
                pitStopsRequired={pitStopsRequired}
                pitStopMinDuration={pitStopMinDuration}
                ballastTarget={ballastTarget}
                initialSegments={strategySegments}
                onStrategyChange={setStrategySegments}
                onValidationChange={setStrategyValidation}
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('connect')} className="flex-1">
                  Retour
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={!canComplete}
                  className="flex-1 gradient-racing"
                >
                  Démarrer l'Analyse
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
