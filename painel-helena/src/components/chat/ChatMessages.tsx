import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types/chat';
import { Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessagesProps {
  messages: Message[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  onReply?: (message: Message) => void;
}

export function ChatMessages({ messages, onLoadMore, hasMore, isLoadingMore, onReply }: ChatMessagesProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const previousMessagesLength = useRef(0);
  const isUserScrolling = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Função para rolar até o final
  const scrollToBottom = (smooth = false) => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Observar mudanças no tamanho do container (quando mídias carregam)
  useEffect(() => {
    const container = messagesContainerRef.current;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    
    if (!container || !viewport) return;

    let scrollTimeout: NodeJS.Timeout;
    
    // Criar ResizeObserver para detectar quando mídias carregam e mudam o tamanho
    resizeObserverRef.current = new ResizeObserver(() => {
      // Limpar timeout anterior
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 150;
      
      // Se usuário está no final ou não está fazendo scroll manual, manter no final
      // Usar múltiplos frames para garantir que todo o conteúdo foi renderizado
      if (isAtBottom || !isUserScrolling.current) {
        scrollTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              scrollToBottom(false);
            });
          });
        }, 50);
      }
    });

    resizeObserverRef.current.observe(container);

    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Scroll automático quando mensagens mudam
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (!viewport || messages.length === 0) return;

    const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 150;
    const hasNewMessages = messages.length > previousMessagesLength.current;

    // Se carregando mensagens antigas, manter posição
    if (isLoadingMore) {
      return;
    }

    // Se há novas mensagens E (usuário está no final OU é primeira carga)
    if (hasNewMessages && (isAtBottom || previousMessagesLength.current === 0 || !isUserScrolling.current)) {
      // Scroll inicial imediato
      requestAnimationFrame(() => {
        scrollToBottom(previousMessagesLength.current > 0);
      });

      // Observar todas as imagens e vídeos para fazer scroll quando carregarem
      const container = messagesContainerRef.current;
      if (container) {
        const mediaElements = container.querySelectorAll('img, video');
        
        if (mediaElements.length > 0) {
          let loadedCount = 0;
          const totalMedia = mediaElements.length;

          mediaElements.forEach((media) => {
            const handleMediaLoad = () => {
              loadedCount++;
              // Fazer scroll após cada mídia carregar
              requestAnimationFrame(() => {
                scrollToBottom(false);
              });
              
              // Scroll final quando todas as mídias carregarem
              if (loadedCount === totalMedia) {
                setTimeout(() => {
                  scrollToBottom(false);
                }, 100);
              }
            };

            if (media instanceof HTMLImageElement) {
              if (media.complete) {
                handleMediaLoad();
              } else {
                media.addEventListener('load', handleMediaLoad, { once: true });
                media.addEventListener('error', handleMediaLoad, { once: true });
              }
            } else if (media instanceof HTMLVideoElement) {
              if (media.readyState >= 2) {
                handleMediaLoad();
              } else {
                media.addEventListener('loadeddata', handleMediaLoad, { once: true });
                media.addEventListener('error', handleMediaLoad, { once: true });
              }
            }
          });
        }
      }
      
      isUserScrolling.current = false;
    }

    previousMessagesLength.current = messages.length;
  }, [messages, isLoadingMore]);

  // Manter posição do scroll ao carregar mensagens antigas
  useEffect(() => {
    if (isLoadingMore) {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        setPreviousScrollHeight(viewport.scrollHeight);
      }
    }
  }, [isLoadingMore]);

  useEffect(() => {
    if (!isLoadingMore && previousScrollHeight > 0) {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        const newScrollHeight = viewport.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeight;
        viewport.scrollTop = scrollDiff;
        setPreviousScrollHeight(0);
      }
    }
}, [isLoadingMore, previousScrollHeight]);

  // Observer para novas mídias adicionadas dinamicamente (primeiro carregamento pesado)
  useEffect(() => {
    const container = messagesContainerRef.current;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (!container || !viewport) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const scheduleScroll = () => {
      const isAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 200;
      if (isAtBottom || !isUserScrolling.current || previousMessagesLength.current === 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          requestAnimationFrame(() => {
            scrollToBottom(false);
            requestAnimationFrame(() => scrollToBottom(false));
          });
        }, 50);
      }
    };

    const observer = new MutationObserver((mutations) => {
      let relevant = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (
              node instanceof HTMLElement &&
              (node.tagName === 'IMG' || node.tagName === 'VIDEO' || !!node.querySelector?.('img,video'))
            ) {
              relevant = true;
            }
          });
        }
        if (
          m.type === 'attributes' &&
          (m.target instanceof HTMLImageElement || m.target instanceof HTMLVideoElement) &&
          m.attributeName === 'src'
        ) {
          relevant = true;
        }
      }
      if (relevant) scheduleScroll();
    });

    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

    // Anexar listeners de carga às mídias já presentes
    const mediaElements = container.querySelectorAll('img, video');
    mediaElements.forEach((media) => {
      const handler = () => scheduleScroll();
      if (media instanceof HTMLImageElement) {
        if (media.complete) handler();
        else {
          media.addEventListener('load', handler, { once: true });
          media.addEventListener('error', handler, { once: true });
        }
      } else if (media instanceof HTMLVideoElement) {
        if (media.readyState >= 2) handler();
        else {
          media.addEventListener('loadeddata', handler, { once: true });
          media.addEventListener('error', handler, { once: true });
        }
      }
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [messages.length]);

  // Detectar scroll manual do usuário
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (!viewport) return;

    const handleScroll = () => {
      // Detectar se está no topo para carregar mais
      if (viewport.scrollTop < 100 && hasMore && !isLoadingMore) {
        onLoadMore();
      }

      // Detectar se usuário está fazendo scroll manual
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      isUserScrolling.current = true;
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 1000);

      // Detectar se está longe do final para mostrar botão
      const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 200;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [hasMore, isLoadingMore, onLoadMore, messages.length]);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const timestamp = message.timestamp instanceof Date 
        ? message.timestamp 
        : new Date(message.timestamp);
      
      const date = timestamp.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const sortedMessages = [...messages].sort((a, b) => {
    const getTime = (v: any) => (v instanceof Date ? v.getTime() : new Date(v).getTime());
    const ta = getTime((a as any).timestamp);
    const tb = getTime((b as any).timestamp);
    if (ta !== tb) return ta - tb; // primary: timestamp asc
    const ca = (a as any).created_at ? getTime((a as any).created_at) : ta;
    const cb = (b as any).created_at ? getTime((b as any).created_at) : tb;
    if (ca !== cb) return ca - cb; // secondary: created_at asc when available
    return String(a.id).localeCompare(String(b.id)); // final tie-breaker: id
  });
  const messageGroups = groupMessagesByDate(sortedMessages);

  return (
    <div className="flex-1 relative min-h-0">
      <ScrollArea ref={scrollAreaRef} className="h-full p-4 pb-6 bg-[hsl(var(--whatsapp-chat-bg))]">
        <div ref={messagesContainerRef} className="space-y-2 py-4">
          {hasMore && (
            <div className="flex justify-center py-2 mb-4">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Carregando mensagens...
                </div>
              ) : (
                <button
                  onClick={onLoadMore}
                  className="text-xs text-primary hover:underline px-3 py-1 rounded-md bg-background/50"
                >
                  Carregar mensagens anteriores
                </button>
              )}
            </div>
          )}
          {Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center my-4">
                <span className="text-xs bg-[hsl(var(--whatsapp-message-received))] px-3 py-1 rounded-md shadow-sm">
                  {date}
                </span>
              </div>
              {msgs.map((message) => (
                <MessageBubble key={message.id} message={message} onReply={onReply} />
              ))}
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>

      {/* Botão para rolar para baixo */}
      {showScrollButton && (
        <Button
          onClick={() => scrollToBottom(true)}
          size="icon"
          className="absolute bottom-6 right-6 rounded-full shadow-lg animate-scale-in z-10"
          aria-label="Ir para últimas mensagens"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
