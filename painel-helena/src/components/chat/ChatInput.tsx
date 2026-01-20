import { useState, useRef } from 'react';
import { Smile, Paperclip, Mic, Send, Image as ImageIcon, FileText, Video, AudioLines, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatInputProps {
  onSendMessage: (message: string, replyToId?: string) => void;
  onSendMedia: (file: File, type: 'image' | 'video' | 'document' | 'audio' | 'ptt') => void;
  onSendLocation?: (latitude: number, longitude: number, name?: string, address?: string) => void;
  replyingTo?: {
    id: string;
    text: string;
    senderName?: string;
    type?: string;
  } | null;
  onCancelReply?: () => void;
}

export function ChatInput({ onSendMessage, onSendMedia, onSendLocation, replyingTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | 'audio'>('image');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length;
    const textBeforeCursor = message.slice(0, cursorPosition);
    const textAfterCursor = message.slice(cursorPosition);
    setMessage(textBeforeCursor + emojiData.emoji + textAfterCursor);
    
    // Focar no textarea após inserir emoji
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = cursorPosition + emojiData.emoji.length;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, replyingTo?.id);
      setMessage('');
      onCancelReply?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendMedia(file, mediaType);
    }
  };

  const openFileDialog = (type: 'image' | 'video' | 'document' | 'audio') => {
    setMediaType(type);
    fileInputRef.current?.click();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        const audioFile = new File([audioBlob], `ptt-${Date.now()}.ogg`, { type: 'audio/ogg' });
        onSendMedia(audioFile, 'ptt');
        
        // Limpar stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
      audioChunksRef.current = [];
      setIsRecording(false);
    }
  };

  const handleSendLocation = () => {
    if (!onSendLocation) {
      toast.error('Funcionalidade de localização não disponível');
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSendLocation(
            position.coords.latitude,
            position.coords.longitude,
            'Minha localização',
            ''
          );
          toast.success('Localização enviada!');
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          toast.error('Não foi possível obter sua localização');
        }
      );
    } else {
      toast.error('Seu navegador não suporta geolocalização');
    }
  };

  return (
    <div className="p-4 border-t border-border bg-[hsl(var(--whatsapp-sidebar))]">
      {/* Preview da mensagem sendo respondida */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-[hsl(var(--whatsapp-bg))] border-l-4 border-primary rounded flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-primary truncate">
              {replyingTo.senderName || 'Contato'}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {replyingTo.text || 'Mídia'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-[hsl(var(--whatsapp-hover))]"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[hsl(var(--whatsapp-hover))]"
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-auto p-0 border-none shadow-lg">
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              searchPlaceHolder="Buscar emoji..."
              width={350}
              height={400}
            />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-[hsl(var(--whatsapp-hover))]"
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => openFileDialog('document')}>
              <FileText className="h-4 w-4 mr-2" />
              Documento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openFileDialog('image')}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Imagem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openFileDialog('video')}>
              <Video className="h-4 w-4 mr-2" />
              Vídeo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openFileDialog('audio')}>
              <AudioLines className="h-4 w-4 mr-2" />
              Áudio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSendLocation}>
              <MapPin className="h-4 w-4 mr-2" />
              Localização
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept={
            mediaType === 'image' ? 'image/*' :
            mediaType === 'video' ? 'video/*' :
            mediaType === 'audio' ? 'audio/*' :
            '.pdf,.doc,.docx,.xls,.xlsx,.txt'
          }
        />

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite uma mensagem"
          className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-[hsl(var(--whatsapp-bg))] border-none"
          rows={1}
        />

        {message.trim() ? (
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-primary hover:bg-[hsl(var(--primary-hover))]"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : isRecording ? (
          <div className="flex items-center gap-2">
            <Button
              onClick={cancelRecording}
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10"
            >
              <X className="h-5 w-5 text-destructive" />
            </Button>
            <Button
              onClick={stopRecording}
              size="icon"
              className="bg-primary hover:bg-[hsl(var(--primary-hover))] animate-pulse"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={startRecording}
            variant="ghost"
            size="icon"
            className="hover:bg-[hsl(var(--whatsapp-hover))]"
          >
            <Mic className="h-5 w-5 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
