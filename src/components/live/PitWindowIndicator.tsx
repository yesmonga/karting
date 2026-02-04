import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Users, CheckCircle, XCircle } from 'lucide-react';
import { PitWindow } from '@/hooks/useAIAdvisor';

interface PitWindowIndicatorProps {
  pitWindow: PitWindow;
  pitsRemaining: number;
}

export function PitWindowIndicator({
  pitWindow,
  pitsRemaining,
}: PitWindowIndicatorProps) {
  return (
    <Card className={`glass-card border-2 transition-all ${
      pitWindow.isOpen ? 'border-green-500/50 bg-green-500/5' : 'border-border'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-racing font-semibold">
            <Wrench className="w-4 h-4 text-primary" />
            Fenêtre Pit
          </div>
          <Badge 
            variant={pitWindow.isOpen ? 'default' : 'secondary'}
            className={pitWindow.isOpen ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {pitWindow.isOpen ? 'OUVERTE' : 'FERMÉE'}
          </Badge>
        </div>

        {pitWindow.reason && (
          <p className="text-sm text-muted-foreground mb-3">{pitWindow.reason}</p>
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            {pitWindow.trackClear ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span>Piste {pitWindow.trackClear ? 'calme' : 'chargée'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{pitWindow.driversInPit.length} aux stands</span>
          </div>

          <div className="ml-auto font-racing font-semibold">
            {pitsRemaining} pit(s) restant(s)
          </div>
        </div>

        {pitWindow.driversInPit.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Aux stands: {pitWindow.driversInPit.slice(0, 3).join(', ')}
            {pitWindow.driversInPit.length > 3 && ` +${pitWindow.driversInPit.length - 3}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
