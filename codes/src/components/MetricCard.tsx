import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: "default" | "primary" | "secondary" | "accent";
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className,
  variant = "default"
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-gradient-card border-border",
    primary: "bg-gradient-primary text-white border-primary",
    secondary: "bg-gradient-secondary text-white border-secondary", 
    accent: "bg-gradient-accent text-white border-accent"
  };

  const iconBgStyles = {
    default: "bg-primary/10 text-primary",
    primary: "bg-white/20 text-white",
    secondary: "bg-white/20 text-white",
    accent: "bg-white/20 text-white"
  };

  return (
    <Card className={cn(
      "shadow-soft hover:shadow-medium transition-shadow duration-300",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn(
              "text-sm font-medium mb-1",
              variant === "default" ? "text-muted-foreground" : "text-current opacity-90"
            )}>
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span className={cn(
                  "text-sm font-medium flex items-center",
                  trend.isPositive 
                    ? variant === "default" 
                      ? "text-success" 
                      : "text-white opacity-90"
                    : variant === "default"
                      ? "text-destructive"
                      : "text-white opacity-90"
                )}>
                  {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className={cn(
                "text-sm mt-1",
                variant === "default" ? "text-muted-foreground" : "text-current opacity-75"
              )}>
                {description}
              </p>
            )}
          </div>
          
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center ml-4",
            iconBgStyles[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}