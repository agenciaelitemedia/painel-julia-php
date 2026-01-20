export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageTimestamp?: string | null;
  unreadCount?: number;
  isOnline?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  isGroup?: boolean;
  status?: string;
  tags?: string[];
  instanceName?: string;
  instanceDeleted?: string;
}

export type NotificationType = 
  | 'service_started' 
  | 'service_ended' 
  | 'service_transfer' 
  | 'agent_activated' 
  | 'agent_paused'
  | 'agent_paused_global'
  | 'agent_resumed'
  | 'agent_resumed_global'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted';

export interface Message {
  id: string;
  chatId?: string;
  messageId?: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'ptt' | 'document' | 'location' | 'contact' | 'buttons' | 'button_reply' | 'list' | 'system_notification';
  text?: string;
  content?: string;
  timestamp: string | Date;
  fromMe?: boolean;
  sender?: 'me' | 'contact';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  replyTo?: string;
  quotedMessage?: {
    text?: string;
    type?: string;
    senderName?: string;
  };
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
  contactId?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  isEdited?: boolean;
  editedAt?: string;
  metadata?: {
    buttons?: Array<{ id: string; text: string }>;
    listTitle?: string;
    listDescription?: string;
    listSections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    isDeleted?: boolean;
    deletedAt?: string;
    isEdited?: boolean;
    editedAt?: string;
    notificationType?: NotificationType;
  };
}

export interface Chat {
  contact: Contact;
  messages: Message[];
}
