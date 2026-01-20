import { Check, CheckCheck, Clock, Image as ImageIcon, FileText, Video, Music, Mic, Play, Pause, Undo, MapPin, File, FileSpreadsheet, FileArchive, FileCode } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import { SystemNotification } from './SystemNotification';

// Helper function to format WhatsApp text with markdown-like syntax
const formatWhatsAppText = (text: string) => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Check for list items (bullet or numbered)
    const bulletMatch = line.match(/^(\*|-)\s+(.+)$/);
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    const quoteMatch = line.match(/^>\s+(.+)$/);
    
    // Handle bullet lists
    if (bulletMatch) {
      const content = formatInlineText(bulletMatch[2]);
      return (
        <div key={lineIndex} className="flex gap-2">
          <span>•</span>
          <span>{content}</span>
        </div>
      );
    }
    
    // Handle numbered lists
    if (numberedMatch) {
      const content = formatInlineText(numberedMatch[2]);
      return (
        <div key={lineIndex} className="flex gap-2">
          <span>{numberedMatch[1]}.</span>
          <span>{content}</span>
        </div>
      );
    }
    
    // Handle quotes
    if (quoteMatch) {
      const content = formatInlineText(quoteMatch[1]);
      return (
        <div key={lineIndex} className="border-l-2 border-primary pl-2 my-1">
          <span className="italic">{content}</span>
        </div>
      );
    }
    
    // Regular line with inline formatting
    const formatted = formatInlineText(line);
    return <div key={lineIndex}>{formatted}</div>;
  });
};

// Helper function to format inline text (bold, italic, strikethrough, code, links)
const formatInlineText = (text: string) => {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  while (remaining.length > 0) {
    let matched = false;
    
    // Try to match URL first (highest priority)
    const urlMatch = remaining.match(/^(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      elements.push(
        <a
          key={key++}
          href={urlMatch[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline hover:text-blue-600"
          onClick={(e) => e.stopPropagation()}
        >
          {urlMatch[1]}
        </a>
      );
      remaining = remaining.slice(urlMatch[1].length);
      matched = true;
      continue;
    }
    
    // Try to match formatting patterns
    const patterns = [
      { regex: /^\*\*\*([^*]+)\*\*\*/, render: (text: string) => <strong key={key++}><em>{text}</em></strong> }, // ***bold+italic***
      { regex: /^\*\*([^*]+)\*\*/, render: (text: string) => <strong key={key++}>{text}</strong> },     // **bold** (alternativa)
      { regex: /^\*([^*]+)\*/, render: (text: string) => <strong key={key++}>{text}</strong> },        // *bold*
      { regex: /^__([^_]+)__/, render: (text: string) => <em key={key++}>{text}</em> },               // __italic__ (alternativa)
      { regex: /^_([^_]+)_/, render: (text: string) => <em key={key++}>{text}</em> },                 // _italic_
      { regex: /^~([^~]+)~/, render: (text: string) => <s key={key++}>{text}</s> },                   // ~strikethrough~
      { regex: /^```([^`]+)```/, render: (text: string) => <code key={key++} className="bg-black/20 px-1 rounded font-mono text-sm">{text}</code> }, // ```monospace```
      { regex: /^`([^`]+)`/, render: (text: string) => <code key={key++} className="bg-black/20 px-1 rounded font-mono text-sm">{text}</code> },     // `inline code`
    ];
    
    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match) {
        elements.push(pattern.render(match[1]));
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // No pattern matched, add the character as-is
      elements.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }
  
  return <>{elements}</>;
};

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
}

export function MessageBubble({ message, onReply }: MessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const formatTime = (timestamp: string | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Carregar mídia (áudio, imagem, vídeo, documento) quando necessário
  useEffect(() => {
    const waId = (message as any).messageId ?? (message as any).message_id;

    // Para áudio/ptt: primeiro tenta usar mediaUrl se for válida, senão baixa da API
    if ((message.type === 'audio' || message.type === 'ptt') && !audioUrl) {
      // Se já tem mediaUrl válida (blob local ou URL pública não-enc), usar diretamente
      if (message.mediaUrl) {
        const url = message.mediaUrl;
        const isEnc = /\.enc(?:$|[?&#])/i.test(url);
        
        if (!isEnc) {
          console.log('Usando mediaUrl existente para áudio:', url.substring(0, 100));
          setAudioUrl(url);
          return;
        }
      }

      // Se não tem URL válida mas tem ID, baixar da API (independente de fromMe)
      if (waId) {
        console.log('Baixando áudio/ptt da API:', {
          type: message.type,
          waId,
          fromMe: message.fromMe
        });
        
        const loadAudio = async () => {
          setIsLoadingAudio(true);
          try {
            const { whatsappClient } = await import('@/lib/whatsapp/client/whatsapp-client');
            const url = await whatsappClient.downloadMedia(waId);
            setAudioUrl(url);
            console.log('Áudio/PTT baixado com sucesso:', url.substring(0, 100));
          } catch (error) {
            console.error('Erro ao baixar áudio/ptt:', error);
          } finally {
            setIsLoadingAudio(false);
          }
        };
        loadAudio();
      }
    }

    // Para documento: baixar o arquivo real da API
    if (message.type === 'document' && !documentUrl && waId) {
      const loadDocument = async () => {
        setIsLoadingDocument(true);
        try {
          const { whatsappClient } = await import('@/lib/whatsapp/client/whatsapp-client');
          const url = await whatsappClient.downloadMedia(waId);
          
          if (typeof url === 'string' && !url.includes('.enc')) {
            setDocumentUrl(url);
            console.log('Documento baixado com sucesso:', url.substring(0, 100));
          } else {
            console.warn('URL de documento inválida ou criptografada');
          }
        } catch (error) {
          console.error('Erro ao baixar documento:', error);
        } finally {
          setIsLoadingDocument(false);
        }
      };
      loadDocument();
    }

    // Para imagem ou vídeo: exibir preview do thumbnail (se existir) e tentar baixar em background
    if (message.type === 'image' || message.type === 'video') {
      const waId = (message as any).messageId ?? (message as any).message_id;

      // 1) Usar mediaUrl existente se não for .enc
      if (message.mediaUrl) {
        const url = message.mediaUrl;
        const isEnc = /\.enc(?:$|[?&#])/i.test(url);
        if (!isEnc && url !== mediaUrl) {
          setMediaUrl(url);
        }
      }

      // 2) Se não tiver URL válida, usar thumbnail do metadata (JPEGThumbnail)
      const meta: any = (message as any).metadata;
      const thumb = meta?.JPEGThumbnail || meta?.jpegThumbnail || meta?.thumbnail;
      if (!mediaUrl && typeof thumb === 'string' && thumb.length > 100) {
        const thumbUrl = thumb.startsWith('data:') ? thumb : `data:image/jpeg;base64,${thumb}`;
        setMediaUrl(thumbUrl);
      }

      // 3) Tentar baixar a mídia completa (usar messageId correto)
      const downloadId = waId; // usar o ID detectado (messageId ou message_id)
      if (downloadId && !isLoadingMedia) {
        const doLoad = async () => {
          setIsLoadingMedia(true);
          try {
            const { whatsappClient } = await import('@/lib/whatsapp/client/whatsapp-client');
            const url = await whatsappClient.downloadMedia(downloadId);
            
            if (typeof url === 'string') {
              if (/\.enc(?:$|[?&#])/i.test(url)) {
                console.warn('Mídia criptografada (.enc), mantendo prévia');
                setMediaError('Prévia — mídia criptografada');
              } else if (url.startsWith('http') || url.startsWith('data:')) {
                setMediaUrl(url);
                setMediaError(null);
                console.log('Mídia carregada:', url.substring(0, 80));
              }
            }
          } catch (error: any) {
            console.error('Erro ao baixar mídia:', error);
            if (!mediaUrl) setMediaError('Falha ao baixar');
          } finally {
            setIsLoadingMedia(false);
          }
        };
        doLoad();
      }
    }
  }, [message, audioUrl, mediaUrl, documentUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) audio.currentTime = 0;
    };
    const handleError = (e: Event) => {
      console.error('Erro ao carregar áudio:', e);
      console.error('Audio error details:', {
        error: audio.error,
        src: audio.src,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setVideoCurrentTime(video.currentTime);
    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) {
        setVideoDuration(video.duration);
      }
    };
    const handleEnded = () => {
      setIsVideoPlaying(false);
      setVideoCurrentTime(0);
      if (video) video.currentTime = 0;
    };
    const handlePlay = () => setIsVideoPlaying(true);
    const handlePause = () => setIsVideoPlaying(false);
    const handleError = (e: Event) => {
      console.error('Erro ao carregar vídeo:', e);
      console.error('Video error details:', {
        error: (video as any).error,
        src: video.src,
        networkState: video.networkState,
        readyState: video.readyState
      });
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [mediaUrl]);

  const toggleVideoPlay = async () => {
    if (!videoRef.current) {
      console.error('Video ref não disponível');
      return;
    }
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setIsVideoPlaying(true);
      } catch (error) {
        console.error('Erro ao reproduzir vídeo:', error);
      }
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) {
      console.error('Audio ref não disponível');
      return;
    }
    
    console.log('Toggle play - URL do áudio:', message.mediaUrl);
    console.log('Estado atual do áudio:', {
      paused: audioRef.current.paused,
      currentTime: audioRef.current.currentTime,
      duration: audioRef.current.duration,
      readyState: audioRef.current.readyState,
      src: audioRef.current.src
    });
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        } catch (error) {
          console.error('Erro ao reproduzir áudio:', error);
          console.warn('Aguardando URL processada (mp3). Não é possível reproduzir links .enc do WhatsApp.');
        }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * duration;
  };

  const handleVideoProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * videoDuration;
  };
  // Verificar se mensagem foi excluída ou editada
  const isDeleted = message.isDeleted || message.metadata?.isDeleted;
  const isEdited = message.isEdited || message.metadata?.isEdited;

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getMediaIcon = () => {
    switch (message.type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getDocumentIcon = (fileName?: string) => {
    if (!fileName) return <File className="h-5 w-5" />;

    const ext = fileName.toLowerCase().split('.').pop() || '';

    // PDFs e documentos de texto
    if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'txt') {
      return <FileText className="h-5 w-5" />;
    }
    
    // Planilhas
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
      return <FileSpreadsheet className="h-5 w-5" />;
    }
    
    // Arquivos compactados
    if (ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar' || ext === 'gz') {
      return <FileArchive className="h-5 w-5" />;
    }
    
    // Código
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'php', 'cpp', 'c', 'h'].includes(ext)) {
      return <FileCode className="h-5 w-5" />;
    }
    
    // Imagens
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
      return <ImageIcon className="h-5 w-5" />;
    }
    
    // Vídeos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext)) {
      return <Video className="h-5 w-5" />;
    }
    
    // Áudio
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
      return <Music className="h-5 w-5" />;
    }

    // Default
    return <File className="h-5 w-5" />;
  };

  const getDocumentColor = (fileName?: string) => {
    if (!fileName) return 'from-gray-600 to-gray-700';

    const ext = fileName.toLowerCase().split('.').pop() || '';

    if (ext === 'pdf') return 'from-red-600 to-red-700';
    if (ext === 'doc' || ext === 'docx') return 'from-blue-600 to-blue-700';
    if (ext === 'xls' || ext === 'xlsx') return 'from-green-600 to-green-700';
    if (ext === 'zip' || ext === 'rar' || ext === '7z') return 'from-yellow-600 to-yellow-700';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'from-purple-600 to-purple-700';

    return 'from-gray-600 to-gray-700';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Se for notificação do sistema, renderizar componente especial
  if (message.type === 'system_notification' && message.metadata?.notificationType) {
    return (
      <SystemNotification
        type={message.metadata.notificationType}
        message={message.text || message.content || ''}
        timestamp={message.timestamp}
      />
    );
  }

  return (
    <div className={cn(
      "flex mb-2 group",
      message.fromMe ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[65%] rounded-lg px-3 py-2 shadow-sm relative",
        message.fromMe 
          ? "bg-[hsl(var(--whatsapp-message-sent))] text-foreground" 
          : "bg-[hsl(var(--whatsapp-message-received))] text-foreground"
      )}>
        {/* Botão de responder (aparece no hover) */}
        {onReply && (
          <button
            onClick={() => onReply(message)}
            className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full p-1.5 shadow-md hover:bg-muted"
            title="Responder"
          >
            <Undo size={16} />
          </button>
        )}
        
        {/* Mensagem citada (quoted) */}
        {message.quotedMessage && (
          <div className={cn(
            "mb-2 p-2 rounded-md border-l-4",
            message.fromMe 
              ? "bg-black/10 border-[#00a884]" 
              : "bg-black/5 border-[#06cf9c]"
          )}>
            <div className={cn(
              "text-xs font-medium mb-0.5",
              message.fromMe ? "text-[#00a884]" : "text-[#06cf9c]"
            )}>
              {message.quotedMessage.senderName || 'Contato'}
            </div>
            <div className="text-xs text-foreground/70 line-clamp-2">
              {message.quotedMessage.text || 'Mídia'}
            </div>
          </div>
        )}
        
        {message.type !== 'text' && (
          <div className="mb-2">
            {/* Imagem */}
            {message.type === 'image' && (
              <div className="relative">
                {isLoadingMedia ? (
                  <div className="flex items-center justify-center p-8 bg-background/10 rounded-md">
                    <div className="text-xs text-muted-foreground">Carregando imagem...</div>
                  </div>
                ) : mediaUrl ? (
                  <img 
                    src={mediaUrl} 
                    alt="Imagem da mensagem" 
                    className="rounded-md w-[250px] h-[250px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(mediaUrl!, '_blank')}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                    <div className="flex items-center gap-2 p-4 bg-background/10 rounded-md">
                      <ImageIcon className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="text-sm">Imagem</span>
                        {mediaError && (
                          <span className="text-xs text-muted-foreground">{mediaError}</span>
                        )}
                        {message.mediaUrl && (
                          <a
                            href={message.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-xs underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Abrir link da mídia
                          </a>
                        )}
                        <button
                          type="button"
                          className="mt-1 text-xs underline"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              setIsLoadingMedia(true);
                              const waId = (message as any).messageId ?? (message as any).message_id;
                              const { whatsappClient } = await import('@/lib/whatsapp/client/whatsapp-client');
                              const url = await whatsappClient.downloadMedia(waId);
                              setMediaUrl(url);
                              setMediaError(null);
                            } catch (err: any) {
                              setMediaError(err?.message || 'Falha ao baixar mídia');
                            } finally {
                              setIsLoadingMedia(false);
                            }
                          }}
                        >
                          Tentar baixar
                        </button>
                      </div>
                    </div>
                )}
              </div>
            )}
            
            {/* Vídeo */}
            {message.type === 'video' && (
              <div className="relative">
                {isLoadingMedia ? (
                  <div className="flex items-center justify-center p-8 bg-background/10 rounded-md">
                    <div className="text-xs text-muted-foreground">Carregando vídeo...</div>
                  </div>
                ) : mediaUrl ? (
                    <div>
                      <video 
                        ref={videoRef}
                        src={mediaUrl} 
                        className="rounded-md w-[250px] h-[250px] object-cover"
                        preload="metadata"
                        controls
                      >
                        Seu navegador não suporta a reprodução de vídeo.
                      </video>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={toggleVideoPlay}
                          disabled={!mediaUrl}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-background/20 hover:bg-background/30 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          {isVideoPlaying ? (
                            <Pause className="h-5 w-5" fill="currentColor" />
                          ) : (
                            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                          )}
                        </button>
                        <div className="flex-1 flex flex-col gap-1">
                          <div 
                            className="h-1 bg-background/20 rounded-full cursor-pointer relative"
                            onClick={handleVideoProgressClick}
                          >
                            <div 
                              className="h-full bg-foreground/60 rounded-full"
                              style={{ width: `${videoDuration ? (videoCurrentTime / videoDuration) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] opacity-70">
                            {videoDuration ? `${formatDuration(videoCurrentTime)} / ${formatDuration(videoDuration)}` : formatDuration(videoCurrentTime)}
                          </span>
                        </div>
                        <Video className="h-4 w-4 opacity-50 flex-shrink-0" />
                      </div>
                    </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-background/10 rounded-md">
                    <Video className="h-5 w-5" />
                    <span className="text-sm">Vídeo</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Áudio e PTT */}
            {(message.type === 'audio' || message.type === 'ptt') && (
              <div className="flex items-center gap-2 min-w-[200px]">
                {isLoadingAudio ? (
                  <div className="text-xs text-muted-foreground">Baixando áudio...</div>
                ) : audioUrl ? (
                  <>
                    <button
                      onClick={togglePlay}
                      disabled={!audioUrl}
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-background/20 hover:bg-background/30 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" fill="currentColor" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                      )}
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                      <div 
                        className="h-1 bg-background/20 rounded-full cursor-pointer relative"
                        onClick={handleProgressClick}
                      >
                        <div 
                          className="h-full bg-foreground/60 rounded-full"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] opacity-70">
                        {duration ? `${formatDuration(currentTime)} / ${formatDuration(duration)}` : formatDuration(currentTime)}
                      </span>
                    </div>
                    <Mic className="h-4 w-4 opacity-50 flex-shrink-0" />
                    {audioUrl && (
                      <audio 
                        ref={audioRef} 
                        src={audioUrl} 
                        preload="metadata"
                        crossOrigin="anonymous"
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                    <Mic className="h-4 w-4" />
                    <span>Áudio enviado</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Documento */}
            {message.type === 'document' && (
              <div className="w-full max-w-[280px]">
                {isLoadingDocument ? (
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-white animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">Carregando...</p>
                      <p className="text-xs text-white/70">Aguarde</p>
                    </div>
                  </div>
                ) : documentUrl ? (
                  <a
                    href={documentUrl}
                    download={message.fileName || 'documento'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block p-4 bg-gradient-to-br rounded-lg hover:opacity-90 transition-opacity",
                      getDocumentColor(message.fileName)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <div className="text-white">
                          {getDocumentIcon(message.fileName)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate mb-1">
                          {message.fileName || 'Documento'}
                        </p>
                        <p className="text-xs text-white/80">
                          {message.fileName?.toUpperCase().split('.').pop()} 
                          {(message as any).metadata?.fileSize && (
                            <> • {formatFileSize((message as any).metadata.fileSize)}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="p-4 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg opacity-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                        <div className="text-white">
                          {getDocumentIcon(message.fileName)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate mb-1">
                          {message.fileName || 'Documento'}
                        </p>
                        <p className="text-xs text-white/70">Indisponível</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Localização */}
            {message.type === 'location' && (
              <div className="flex flex-col gap-2">
                {(message as any).metadata?.latitude && (message as any).metadata?.longitude ? (
                  <>
                    <a
                      href={`https://www.google.com/maps?q=${(message as any).metadata.latitude},${(message as any).metadata.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-background/10 rounded-md overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <div className="relative h-[150px] bg-muted flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-primary" />
                      </div>
                      <div className="p-2 text-xs text-center">
                        📍 Ver localização no mapa
                      </div>
                    </a>
                    {(message as any).metadata?.address && (
                      <div className="text-xs opacity-70">
                        {(message as any).metadata.address}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-background/10 rounded-md">
                    <MapPin className="h-5 w-5" />
                    <span className="text-sm">Localização compartilhada</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {message.text && (
          <div>
            {isDeleted ? (
              <p className="text-sm italic opacity-60 flex items-center gap-2">
                <span>🚫</span>
                <span>Esta mensagem foi excluída</span>
              </p>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {formatWhatsAppText(message.text)}
              </p>
            )}
          </div>
        )}
        
        {message.content && !message.text && (
          <div>
            {isDeleted ? (
              <p className="text-sm italic opacity-60 flex items-center gap-2">
                <span>🚫</span>
                <span>Esta mensagem foi excluída</span>
              </p>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">
                {formatWhatsAppText(message.content)}
              </p>
            )}
          </div>
        )}
        
        {/* Botões de ação */}
        {(message.type === 'buttons' || message.type === 'button_reply' || (message as any).metadata?.buttons) && (
          <div className="mt-3 space-y-2">
            {((message as any).metadata?.buttons || []).map((button: any, index: number) => (
              <button
                key={index}
                disabled
                className="w-full py-2 px-4 text-sm rounded-md border border-border/50 bg-background/10 text-foreground opacity-70 cursor-not-allowed"
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
        
        {/* Lista de opções */}
        {(message.type === 'list' || (message as any).metadata?.listSections) && (
          <div className="mt-3">
            {(message as any).metadata?.listTitle && (
              <div className="font-semibold text-sm mb-2">{(message as any).metadata.listTitle}</div>
            )}
            <div className="space-y-3">
              {((message as any).metadata?.listSections || []).map((section: any, sectionIndex: number) => (
                <div key={sectionIndex}>
                  {section.title && (
                    <div className="text-xs font-medium opacity-70 mb-1">{section.title}</div>
                  )}
                  <div className="space-y-1">
                    {(section.rows || []).map((row: any, rowIndex: number) => (
                      <button
                        key={rowIndex}
                        disabled
                        className="w-full py-2 px-3 text-left text-sm rounded-md border border-border/50 bg-background/10 opacity-70 cursor-not-allowed"
                      >
                        <div className="font-medium">{row.title}</div>
                        {row.description && (
                          <div className="text-xs opacity-70 mt-0.5">{row.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-end gap-1 mt-1">
          {isEdited && !isDeleted && (
            <span className="text-[10px] text-muted-foreground italic mr-1">
              editada
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
          {message.fromMe && (
            <span className="text-muted-foreground">
              {getStatusIcon()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
