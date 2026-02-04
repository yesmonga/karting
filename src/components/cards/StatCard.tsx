import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'red' | 'blue' | 'green' | 'amber' | 'purple';
  className?: string;
  delay?: number;
}

const colorClasses = {
  red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  green: 'from-green-500/20 to-green-500/5 border-green-500/30',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
};

const iconBgClasses = {
  red: 'bg-red-500/20 text-red-400',
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
  amber: 'bg-amber-500/20 text-amber-400',
  purple: 'bg-purple-500/20 text-purple-400',
};

export function StatCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  trend, 
  trendDirection = 'neutral',
  color = 'red',
  className,
  delay = 0 
}: StatCardProps) {
  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;
  
  return (
    <div 
      className={cn(
        "glass-card-hover rounded-xl p-5 opacity-0 animate-slide-up",
        `bg-gradient-to-br ${colorClasses[color]}`,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-lg", iconBgClasses[color])}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            trendDirection === 'up' && "bg-green-500/20 text-green-400",
            trendDirection === 'down' && "bg-red-500/20 text-red-400",
            trendDirection === 'neutral' && "bg-muted text-muted-foreground"
          )}>
            <TrendIcon className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="font-racing text-2xl font-bold tracking-wide">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
