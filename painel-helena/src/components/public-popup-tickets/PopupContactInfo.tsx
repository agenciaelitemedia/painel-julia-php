import { User, Phone, Mail, Clock, Tag, Instagram, FileText, Folder } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HelenaContactInfo } from "@/hooks/useHelenaContactInfo";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PopupContactInfoProps {
  contactInfo: HelenaContactInfo | null;
  isLoading: boolean;
  fallbackName?: string;
  fallbackPhone?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function PopupContactInfo({
  contactInfo,
  isLoading,
  fallbackName,
  fallbackPhone,
}: PopupContactInfoProps) {
  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Card>
    );
  }

  const name = contactInfo?.name || fallbackName || 'Contato';
  const phone = contactInfo?.phoneNumberFormatted || contactInfo?.phoneNumber || fallbackPhone || '';
  const email = contactInfo?.email;
  const instagram = contactInfo?.instagram;
  const annotation = contactInfo?.annotation;
  const tags = contactInfo?.tags || [];
  const portfolios = contactInfo?.portfolios || [];
  const lastInteraction = contactInfo?.updatedAt;

  return (
    <Card className="p-3 bg-muted/30">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 border">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{name}</span>
            {contactInfo?.status && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {contactInfo.status}
              </Badge>
            )}
          </div>

          {/* Phone */}
          {phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{phone}</span>
            </div>
          )}

          {/* Email */}
          {email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{email}</span>
            </div>
          )}

          {/* Instagram */}
          {instagram && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Instagram className="h-3 w-3" />
              <span className="truncate">@{instagram.replace('@', '')}</span>
            </div>
          )}

          {/* Last interaction */}
          {lastInteraction && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Última interação: {formatDistanceToNow(new Date(lastInteraction), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
          )}

          {/* Tags with colors */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {tags.slice(0, 4).map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0 h-4"
                  style={tag.bgColor ? { 
                    backgroundColor: tag.bgColor, 
                    color: tag.textColor || '#fff' 
                  } : undefined}
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Portfolios */}
          {portfolios.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Folder className="h-3 w-3 text-muted-foreground" />
              {portfolios.slice(0, 2).map((portfolio) => (
                <Badge 
                  key={portfolio.id} 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {portfolio.name}
                </Badge>
              ))}
              {portfolios.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{portfolios.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Annotation */}
          {annotation && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{annotation}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}