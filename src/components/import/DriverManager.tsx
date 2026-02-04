import { useState } from 'react';
import { User, Plus, X, Weight, Edit2, Check } from 'lucide-react';
import { calculateBallast, formatBallast } from '@/utils/ballastCalculator';
import { cn } from '@/lib/utils';

export interface Driver {
  id: string;
  name: string;
  code: string;
  color: string;
  weight_kg: number | null;
}

interface DriverManagerProps {
  drivers: Driver[];
  onDriversChange: (drivers: Driver[]) => void;
  ballastTarget: number;
}

const DRIVER_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export function DriverManager({ drivers, onDriversChange, ballastTarget }: DriverManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');

  const addDriver = () => {
    if (!newName.trim()) return;

    const name = newName.trim().toUpperCase();
    const code = String.fromCharCode(65 + drivers.length); // A, B, C, ...
    const color = DRIVER_COLORS[drivers.length % DRIVER_COLORS.length];
    const weight = newWeight ? parseFloat(newWeight) : null;

    const newDriver: Driver = {
      id: crypto.randomUUID(),
      name,
      code,
      color,
      weight_kg: weight,
    };

    onDriversChange([...drivers, newDriver]);
    setNewName('');
    setNewWeight('');
    setShowAddForm(false);
  };

  const removeDriver = (id: string) => {
    onDriversChange(drivers.filter(d => d.id !== id));
  };

  const startEditWeight = (driver: Driver) => {
    setEditingId(driver.id);
    setEditWeight(driver.weight_kg?.toString() || '');
  };

  const saveWeight = (id: string) => {
    const weight = editWeight ? parseFloat(editWeight) : null;
    onDriversChange(
      drivers.map(d => d.id === id ? { ...d, weight_kg: weight } : d)
    );
    setEditingId(null);
    setEditWeight('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-racing text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Pilotes de l'équipe
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-sm flex items-center gap-1 text-primary hover:underline"
        >
          <Plus className="w-4 h-4" />
          Ajouter un pilote
        </button>
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {drivers.map(driver => {
          const ballast = driver.weight_kg 
            ? calculateBallast(driver.weight_kg, ballastTarget) 
            : null;
          const isEditing = editingId === driver.id;

          return (
            <div
              key={driver.id}
              className="p-4 rounded-xl bg-secondary/30 border border-border/30"
              style={{ borderLeftColor: driver.color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-bold text-lg">{driver.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">({driver.code})</span>
                </div>
                <button
                  onClick={() => removeDriver(driver.id)}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Weight className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      placeholder="Poids"
                      className="w-20 px-2 py-1 text-sm rounded bg-background border border-border focus:outline-none focus:border-primary"
                      onKeyDown={(e) => e.key === 'Enter' && saveWeight(driver.id)}
                    />
                    <span className="text-sm text-muted-foreground">kg</span>
                    <button
                      onClick={() => saveWeight(driver.id)}
                      className="p-1 rounded bg-primary text-primary-foreground"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm">
                      {driver.weight_kg ? `${driver.weight_kg} kg` : 'Non défini'}
                    </span>
                    <button
                      onClick={() => startEditWeight(driver)}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {ballast && driver.weight_kg && (
                <div className={cn(
                  "mt-2 text-sm px-2 py-1 rounded",
                  ballast.total > 0 ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"
                )}>
                  Lest: {formatBallast(ballast)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Driver Form */}
      {showAddForm && (
        <div className="p-4 rounded-xl bg-secondary/50 border border-border/30 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Nom</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: ALEX"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
                onKeyDown={(e) => e.key === 'Enter' && addDriver()}
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Poids (kg)</label>
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Ex: 67"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={addDriver}
              disabled={!newName.trim()}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg bg-secondary"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {drivers.length === 0 && !showAddForm && (
        <p className="text-center text-muted-foreground py-4">
          Ajoutez les pilotes de votre équipe
        </p>
      )}
    </div>
  );
}
