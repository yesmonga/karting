import { useState } from 'react';
import { TeamData } from '@/types/race';
import { msToTime } from '@/utils/timeFormat';
import { Users, Trophy, Flag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSelectorProps {
  teams: TeamData[];
  onTeamSelect: (team: TeamData) => void;
}

export function TeamSelector({ teams, onTeamSelect }: TeamSelectorProps) {
  const [selectedKart, setSelectedKart] = useState<number | null>(null);

  const handleSelect = (team: TeamData) => {
    setSelectedKart(team.kartNumber);
    onTeamSelect(team);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-racing text-lg">Sélectionnez votre équipe</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {teams.length} équipes détectées dans les fichiers
      </p>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {teams.map((team) => (
          <button
            key={team.kartNumber}
            onClick={() => handleSelect(team)}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all",
              selectedKart === team.kartNumber
                ? "bg-primary/20 border-2 border-primary"
                : "bg-secondary/30 border border-border/30 hover:bg-secondary/50"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="font-racing text-primary font-bold">#{team.kartNumber}</span>
                </div>
                <div>
                  <p className="font-medium">{team.teamName}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      P{team.position}
                    </span>
                    {team.bestLap > 0 && (
                      <span className="text-green-400">
                        Best: {msToTime(team.bestLap)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {selectedKart === team.kartNumber && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
