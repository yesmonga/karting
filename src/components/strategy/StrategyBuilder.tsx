import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Plus, Trash2, AlertCircle, CheckCircle2, Clock, User, Scale, Rocket, Flag, BarChart3 } from 'lucide-react';
import { StrategySegment, LiveDriver, StrategyValidationResult } from '@/types/live';
import { StrategyTimeline } from './StrategyTimeline';
import {
  generatePresetStrategy,
  validateStrategy,
  formatTime,
  calculateBallastForDriver,
  StrategyPreset,
  STRATEGY_PRESETS,
} from '@/utils/strategyUtils';

interface StrategyBuilderProps {
  drivers: LiveDriver[];
  raceDurationMinutes: number;
  pitStopsRequired: number;
  pitStopMinDuration: number;
  ballastTarget: number;
  initialSegments?: StrategySegment[];
  onStrategyChange: (segments: StrategySegment[]) => void;
  onValidationChange?: (result: StrategyValidationResult) => void;
}

export function StrategyBuilder({
  drivers,
  raceDurationMinutes,
  pitStopsRequired,
  pitStopMinDuration,
  ballastTarget,
  initialSegments = [],
  onStrategyChange,
  onValidationChange,
}: StrategyBuilderProps) {
  const [segments, setSegments] = useState<StrategySegment[]>(initialSegments);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<StrategyPreset | null>(null);

  const validation = useMemo(() => {
    const result = validateStrategy(segments, raceDurationMinutes, pitStopsRequired, pitStopMinDuration);
    onValidationChange?.(result);
    return result;
  }, [segments, raceDurationMinutes, pitStopsRequired, pitStopMinDuration, onValidationChange]);

  const selectedSegment = useMemo(
    () => segments.find((s) => s.id === selectedSegmentId),
    [segments, selectedSegmentId]
  );

  const handlePresetSelect = (preset: StrategyPreset) => {
    setSelectedPreset(preset);
    const newSegments = generatePresetStrategy(preset, drivers, raceDurationMinutes, pitStopsRequired, pitStopMinDuration);
    setSegments(newSegments);
    onStrategyChange(newSegments);
    setSelectedSegmentId(null);
  };

  const handleClear = () => {
    setSegments([]);
    onStrategyChange([]);
    setSelectedSegmentId(null);
    setSelectedPreset(null);
  };

  const getPresetIcon = (preset: StrategyPreset) => {
    switch (preset) {
      case 'UNDERCUT': return <Rocket className="w-5 h-5" />;
      case 'OVERCUT': return <Flag className="w-5 h-5" />;
      case 'BALANCED': return <BarChart3 className="w-5 h-5" />;
    }
  };

  const updateSegment = (id: string, updates: Partial<StrategySegment>) => {
    const newSegments = segments.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates };
      if (updates.startSec !== undefined || updates.endSec !== undefined) {
        updated.durationSec = updated.endSec - updated.startSec;
      }
      return updated;
    });
    setSegments(newSegments);
    onStrategyChange(newSegments);
  };

  const deleteSegment = (id: string) => {
    const newSegments = segments.filter((s) => s.id !== id);
    setSegments(newSegments);
    onStrategyChange(newSegments);
    if (selectedSegmentId === id) setSelectedSegmentId(null);
  };

  const addSegment = (type: 'RUN' | 'PIT') => {
    const sorted = [...segments].sort((a, b) => a.startSec - b.startSec);
    const lastEnd = sorted.length > 0 ? sorted[sorted.length - 1].endSec : 0;
    const totalRaceSec = raceDurationMinutes * 60;

    if (lastEnd >= totalRaceSec) return;

    const defaultDuration = type === 'PIT' ? pitStopMinDuration : Math.min(1800, totalRaceSec - lastEnd);

    const newSegment: StrategySegment = {
      id: crypto.randomUUID(),
      type,
      startSec: lastEnd,
      endSec: Math.min(lastEnd + defaultDuration, totalRaceSec),
      durationSec: Math.min(defaultDuration, totalRaceSec - lastEnd),
      driverId: type === 'RUN' ? drivers[0]?.id : undefined,
    };

    const newSegments = [...segments, newSegment];
    setSegments(newSegments);
    onStrategyChange(newSegments);
    setSelectedSegmentId(newSegment.id);
  };

  return (
    <div className="space-y-4">
      {/* Sélecteur de Preset */}
      <Card className="glass-card">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-primary" />
            Choisir une Stratégie
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {STRATEGY_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                  selectedPreset === preset.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={selectedPreset === preset.id ? 'text-primary' : 'text-muted-foreground'}>
                    {getPresetIcon(preset.id)}
                  </span>
                  <span className="font-racing font-semibold">{preset.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Récap pilotes */}
      <Card className="glass-card">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Pilotes
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex flex-wrap gap-2">
            {drivers.map((driver) => {
              const ballast = calculateBallastForDriver(driver.weightKg, ballastTarget);
              return (
                <div
                  key={driver.id}
                  className="flex items-center gap-2 px-2 py-1 rounded bg-card/50 text-sm"
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver.color }} />
                  <span className="font-medium">{driver.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {driver.weightKg}kg
                  </span>
                  <span className="text-primary text-xs flex items-center gap-0.5">
                    <Scale className="w-3 h-3" />
                    {ballast}kg
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="glass-card">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Timeline ({formatTime(raceDurationMinutes * 60)})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleClear} disabled={segments.length === 0}>
              <Trash2 className="w-3 h-3 mr-1" />
              Effacer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <StrategyTimeline
            segments={segments}
            drivers={drivers}
            raceDurationMinutes={raceDurationMinutes}
            onSegmentClick={(seg) => setSelectedSegmentId(seg.id)}
            selectedSegmentId={selectedSegmentId || undefined}
          />

          {/* Actions rapides */}
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => addSegment('RUN')}>
              <Plus className="w-3 h-3 mr-1" />
              Ajouter Run
            </Button>
            <Button size="sm" variant="outline" onClick={() => addSegment('PIT')}>
              <Plus className="w-3 h-3 mr-1" />
              Ajouter Pit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Éditeur de segment */}
      {selectedSegment && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Éditer {selectedSegment.type === 'RUN' ? 'Run' : 'Pit'}
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteSegment(selectedSegment.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Début (sec)</Label>
                <Input
                  type="number"
                  value={selectedSegment.startSec}
                  onChange={(e) => updateSegment(selectedSegment.id, { startSec: Number(e.target.value) })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fin (sec)</Label>
                <Input
                  type="number"
                  value={selectedSegment.endSec}
                  onChange={(e) => updateSegment(selectedSegment.id, { endSec: Number(e.target.value) })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Durée</Label>
                <div className="h-9 flex items-center px-3 bg-muted/30 rounded-md text-sm">
                  {formatTime(selectedSegment.durationSec)}
                </div>
              </div>
            </div>

            {selectedSegment.type === 'RUN' && (
              <div className="space-y-1">
                <Label className="text-xs">Pilote</Label>
                <Select
                  value={selectedSegment.driverId || ''}
                  onValueChange={(value) => updateSegment(selectedSegment.id, { driverId: value })}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Sélectionner un pilote" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver.color }} />
                          {driver.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation */}
      <Card className={`glass-card ${validation.isValid ? 'border-green-500/30' : 'border-destructive/30'}`}>
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            {validation.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {validation.isValid ? (
                <p className="text-sm text-green-500">Stratégie valide</p>
              ) : (
                <div className="space-y-1">
                  {validation.errors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive">
                      {err.message}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>Pits: {validation.totalPits}/{pitStopsRequired}</span>
                <span>Temps piste: {formatTime(validation.totalRunTime)}</span>
                <span>Temps pit: {formatTime(validation.totalPitTime)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
