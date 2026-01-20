import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HelenaTagInfo {
  id: string;
  name: string;
  bgColor?: string;
  textColor?: string;
}

export interface HelenaPortfolioInfo {
  id: string;
  name: string;
}

export interface HelenaContactInfo {
  id: string;
  name: string;
  nameWhatsapp?: string;
  phoneNumber: string;
  phoneNumberFormatted?: string;
  email?: string;
  instagram?: string;
  annotation?: string;
  tags?: HelenaTagInfo[];
  portfolios?: HelenaPortfolioInfo[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

interface UseHelenaContactInfoResult {
  contactInfo: HelenaContactInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHelenaContactInfo(
  helenaCountId: string,
  helenaContactId: string
): UseHelenaContactInfoResult {
  const [contactInfo, setContactInfo] = useState<HelenaContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sanitize the contact ID to prevent duplicated values
  const sanitizedContactId = helenaContactId?.trim() || '';
  // UUID format: 8-4-4-4-12 = 36 characters, if longer it's probably duplicated
  const cleanContactId = sanitizedContactId.length > 36 
    ? sanitizedContactId.substring(0, 36) 
    : sanitizedContactId;

  const fetchContactInfo = async () => {
    if (!helenaCountId || !cleanContactId) {
      setContactInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('helena-contact-info', {
        body: {
          helena_count_id: helenaCountId,
          contact_id: cleanContactId,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      // Handle fallback case (token not found, use null)
      if (data?.fallback) {
        console.log('[useHelenaContactInfo] Fallback mode - using local data');
        setContactInfo(null);
        return;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch contact info');
      }

      setContactInfo(data.data);
    } catch (err) {
      console.error('[useHelenaContactInfo] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setContactInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, [helenaCountId, cleanContactId]);

  return {
    contactInfo,
    isLoading,
    error,
    refetch: fetchContactInfo,
  };
}