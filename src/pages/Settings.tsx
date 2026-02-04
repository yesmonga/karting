import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Plus, Trash2, Edit2, Check, X, Scale, Loader2 
} from 'lucide-react';
import { useDrivers, DBDriver, DriverInput } from '@/hooks/useDrivers';
import { calculateBallast, formatBallast } from '@/utils/ballastCalculator';

const DRIVER_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export default function Settings() {
  const { drivers, isLoading, createDriver, updateDriver, deleteDriver } = useDrivers();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New driver form
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState(75);
  const [newColor, setNewColor] = useState(DRIVER_COLORS[0]);
  
  // Edit form
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState(75);
  const [editColor, setEditColor] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    createDriver.mutate({
      name: newName,
      weight_kg: newWeight,
      color: newColor,
    });
    
    setNewName('');
    setNewWeight(75);
    setNewColor(DRIVER_COLORS[(drivers.length + 1) % DRIVER_COLORS.length]);
    setShowAddForm(false);
  };

  const startEdit = (driver: DBDriver) => {
    setEditingId(driver.id);
    setEditName(driver.name);
    setEditWeight(driver.weight_kg || 75);
    setEditColor(driver.color);
  };

  const handleUpdate = () => {
    if (!editingId || !editName.trim()) return;
    
    updateDriver.mutate({
      id: editingId,
      name: editName,
      weight_kg: editWeight,
      color: editColor,
    });
    
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce pilote ?')) {
      deleteDriver.mutate(id);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="font-racing text-3xl md:text-4xl font-bold gradient-text-racing mb-2">
            Paramètres
          </h1>
          <p className="text-muted-foreground">
            Gérez vos pilotes et leurs informations
          </p>
        </div>

        {/* Drivers Section */}
        <Card className="glass-card animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-racing flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Pilotes ({drivers.length})
              </CardTitle>
              <Button 
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="gradient-racing"
                disabled={showAddForm}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Form */}
            {showAddForm && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4 animate-slide-up">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du pilote</Label>
                    <Input
                      placeholder="Ex: Alex"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-background/50"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Poids (kg)</Label>
                    <Input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="bg-background/50"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Couleur</Label>
                  <div className="flex gap-2 flex-wrap">
                    {DRIVER_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          newColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Annuler
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleCreate}
                    disabled={!newName.trim() || createDriver.isPending}
                    className="gradient-racing"
                  >
                    {createDriver.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1" />
                    )}
                    Créer
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {/* Driver List */}
            {!isLoading && drivers.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun pilote enregistré</p>
                <p className="text-sm">Cliquez sur "Ajouter" pour créer votre premier pilote</p>
              </div>
            )}

            <div className="space-y-2">
              {drivers.map((driver) => {
                const isEditing = editingId === driver.id;
                const ballast = calculateBallast(driver.weight_kg || 75, 85);
                
                return (
                  <div 
                    key={driver.id}
                    className="flex items-center gap-3 p-4 rounded-lg bg-background/30 border border-border/50 transition-all hover:border-primary/30"
                  >
                    {isEditing ? (
                      <>
                        <div className="flex gap-2 flex-wrap">
                          {DRIVER_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={`w-6 h-6 rounded-full transition-all ${
                                editColor === color ? 'ring-2 ring-primary scale-110' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-background/50 flex-1"
                        />
                        <Input
                          type="number"
                          value={editWeight}
                          onChange={(e) => setEditWeight(Number(e.target.value))}
                          className="bg-background/50 w-20"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon"
                          onClick={handleUpdate}
                          disabled={updateDriver.isPending}
                        >
                          {updateDriver.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div 
                          className="w-3 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: driver.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-racing font-semibold text-lg">{driver.name}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Scale className="w-3 h-3" />
                            <span>{driver.weight_kg || 75}kg</span>
                            <span className="text-primary">{formatBallast(ballast)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {driver.code}
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => startEdit(driver)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleDelete(driver.id)}
                          className="text-destructive hover:text-destructive"
                          disabled={deleteDriver.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
