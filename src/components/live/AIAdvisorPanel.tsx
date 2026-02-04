import { AIAdvice } from '@/hooks/useAIAdvisor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Shield, Wrench, Gauge, Info, Zap } from 'lucide-react';

interface AIAdvisorPanelProps {
  advices: AIAdvice[];
}

const typeIcons: Record<AIAdvice['type'], typeof Target> = {
  ATTACK: Target,
  DEFENSE: Shield,
  PIT: Wrench,
  SECTOR: Gauge,
  PACE: Gauge,
  INFO: Info,
  STRATEGY: Zap,
};

const priorityClasses: Record<AIAdvice['priority'], string> = {
  HIGH: 'bg-destructive/20 border-destructive text-destructive',
  MEDIUM: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  LOW: 'bg-blue-500/20 border-blue-500 text-blue-400',
};

export function AIAdvisorPanel({ advices }: AIAdvisorPanelProps) {
  const recentAdvices = [...advices]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-racing flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-primary" />
          Conseils IA en Temps Réel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentAdvices.length > 0 ? (
            recentAdvices.map((advice) => {
              const Icon = typeIcons[advice.type];
              return (
                <div
                  key={advice.id}
                  className={`p-3 rounded-lg border ${priorityClasses[advice.priority]} animate-slide-up`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{advice.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(advice.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {advice.priority}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Les conseils apparaîtront pendant la course...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
