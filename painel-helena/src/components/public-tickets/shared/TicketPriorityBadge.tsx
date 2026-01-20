import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";

interface TicketPriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const priorityConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  baixa: {
    label: 'Baixa',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    icon: <ArrowDown className="h-3 w-3" />
  },
  normal: {
    label: 'Normal',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: <Minus className="h-3 w-3" />
  },
  alta: {
    label: 'Alta',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    icon: <ArrowUp className="h-3 w-3" />
  },
  critica: {
    label: 'Crítica',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: <AlertTriangle className="h-3 w-3" />
  }
};

export function TicketPriorityBadge({ priority, size = 'md', showIcon = true }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority] || { label: priority, className: 'bg-gray-100 text-gray-800', icon: null };
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''} gap-1`}
    >
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}
