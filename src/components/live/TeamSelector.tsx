import { ApexDriverData } from '@/types/live';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Car, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';

interface TeamSelectorProps {
  teams: ApexDriverData[];
  onTeamSelect: (kart: string, teamName: string) => void;
}

export function TeamSelector({ teams, onTeamSelect }: TeamSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKart, setSelectedKart] = useState<string | null>(null);

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const lower = searchTerm.toLowerCase();
    return teams.filter(t => 
      t.team.toLowerCase().includes(lower) || 
      t.kart.includes(searchTerm)
    );
  }, [teams, searchTerm]);

  const handleSelect = (team: ApexDriverData) => {
    setSelectedKart(team.kart);
  };

  const handleConfirm = () => {
    const team = teams.find(t => t.kart === selectedKart);
    if (team) {
      onTeamSelect(team.kart, team.team);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="font-racing text-3xl md:text-4xl font-bold gradient-text-racing mb-2">
            Sélection Équipe
          </h1>
          <p className="text-muted-foreground">
            Choisissez votre kart parmi les {teams.length} équipes détectées
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou numéro de kart..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto pr-2">
              {filteredTeams.map((team) => (
                <button
                  key={team.kart}
                  onClick={() => handleSelect(team)}
                  className={`flex items-center gap-4 p-4 rounded-lg text-left transition-all ${
                    selectedKart === team.kart
                      ? 'bg-primary/20 border-2 border-primary glow-red-subtle'
                      : 'bg-background/30 border border-border/50 hover:bg-background/50 hover:border-primary/30'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-racing font-bold text-lg">#{team.kart}</span>
                      <span className="font-semibold truncate">{team.team}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>P{team.position}</span>
                      <span>{team.laps} tours</span>
                      {team.bestLap && <span>Best: {team.bestLap}</span>}
                    </div>
                  </div>

                  {selectedKart === team.kart && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}

              {filteredTeams.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune équipe trouvée
                </div>
              )}
            </div>

            {selectedKart && (
              <Button 
                onClick={handleConfirm}
                className="w-full mt-6 gradient-racing"
                size="lg"
              >
                Confirmer la sélection
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
