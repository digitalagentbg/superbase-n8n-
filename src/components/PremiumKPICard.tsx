import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PremiumKPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  gradient?: boolean;
}

export function PremiumKPICard({
  title,
  value,
  change,
  icon: Icon,
  description,
  trend = 'neutral',
  className,
  gradient = false
}: PremiumKPICardProps) {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeColor = (type: 'increase' | 'decrease') => {
    return type === 'increase' ? 'status-success' : 'status-error';
  };

  return (
    <Card 
      className={cn(
        "hover-lift group relative overflow-hidden",
        gradient && "bg-gradient-to-br from-card to-card/50",
        className
      )}
    >
      {/* Gradient overlay for premium effect */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary-glow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              gradient 
                ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow" 
                : "bg-primary/10 text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground/70">{description}</p>
              )}
            </div>
          </div>
          
          {change && (
            <Badge variant="outline" className={getChangeColor(change.type)}>
              {change.type === 'increase' ? '+' : ''}{change.value}%
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-end justify-between">
          <div>
            <div className={cn(
              "text-3xl font-bold tracking-tight",
              gradient && "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
            )}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            
            {trend !== 'neutral' && (
              <div className="flex items-center mt-2 space-x-1">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  trend === 'up' ? 'bg-success animate-pulse' : 'bg-destructive'
                )} />
                <span className={cn("text-xs font-medium", getTrendColor(trend))}>
                  {trend === 'up' ? 'Trending up' : 'Trending down'}
                </span>
              </div>
            )}
          </div>
          
          {/* Decorative element */}
          <div className="opacity-20 group-hover:opacity-40 transition-opacity duration-300">
            <Icon className="h-16 w-16 text-primary/20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}