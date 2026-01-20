import { CheckCircle2, Clipboard, Bot, BotOff, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types/chat';

interface SystemNotificationProps {
  type: NotificationType;
  message: string;
  timestamp: string | Date;
}

export function SystemNotification({ type, message, timestamp }: SystemNotificationProps) {
  const formatTime = (ts: string | Date) => {
    const date = ts instanceof Date ? ts : new Date(ts);
    const d = date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
    const h = date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    return `${d} às ${h}`;
  };

  const getIcon = () => {
    switch (type) {
      case 'service_started':
        return <Clipboard className="h-4 w-4 text-[hsl(var(--primary))]" />;
      case 'service_ended':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'agent_activated':
      case 'agent_resumed':
      case 'agent_resumed_global':
        return <Bot className="h-4 w-4 text-green-600" />;
      case 'agent_paused':
      case 'agent_paused_global':
        return <BotOff className="h-4 w-4 text-amber-600" />;
      case 'note_created':
      case 'note_updated':
      case 'note_deleted':
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'service_started':
        return 'text-[hsl(var(--primary))]';
      case 'service_ended':
        return 'text-green-700';
      case 'agent_activated':
      case 'agent_resumed':
      case 'agent_resumed_global':
        return 'text-green-700';
      case 'agent_paused':
      case 'agent_paused_global':
        return 'text-amber-700';
      case 'note_created':
      case 'note_updated':
      case 'note_deleted':
        return 'text-blue-700';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex justify-center my-2 px-4">
      <div className="flex items-center gap-3 w-full max-w-2xl">
        <span className="flex-1 border-t border-[hsl(var(--border))]" />
        <div className={cn('inline-flex items-center gap-2 text-xs font-medium', getTextColor())}>
          {getIcon()}
          <span>
            {message} <span className="font-semibold">em {formatTime(timestamp)}</span>
          </span>
        </div>
        <span className="flex-1 border-t border-[hsl(var(--border))]" />
      </div>
    </div>
  );
}
