import { cn } from '@/lib/utils';
import { Advice } from '@/utils/adviceGenerator';
import { Zap, Target, AlertTriangle, Info } from 'lucide-react';

interface AdviceCardProps {
  advice: Advice;
  className?: string;
}

const typeConfig = {
  performance: {
    icon: Zap,
    bg: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  strategy: {
    icon: Target,
    bg: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'from-red-500/20 to-red-500/5',
    border: 'border-red-500/30',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
  },
  info: {
    icon: Info,
    bg: 'from-green-500/20 to-green-500/5',
    border: 'border-green-500/30',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
  },
};

export function AdviceCard({ advice, className }: AdviceCardProps) {
  const config = typeConfig[advice.type];
  const Icon = config.icon;
  
  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-4 transition-all duration-300 hover:border-border/50",
        `bg-gradient-to-br ${config.bg} ${config.border}`,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", config.iconBg)}>
          <Icon className={cn("w-4 h-4", config.iconColor)} />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{advice.icon}</span>
            <h4 className="font-medium text-sm truncate">{advice.title}</h4>
            {advice.priority === 'high' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 uppercase tracking-wider">
                Urgent
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {advice.message}
          </p>
        </div>
      </div>
    </div>
  );
}
