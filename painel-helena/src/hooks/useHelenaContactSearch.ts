import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HelenaContact {
  id: string;
  name: string;
  nameWhatsapp?: string;
  phoneNumber: string;
  phoneNumberFormatted?: string;
  email?: string;
  tagNames?: string[];
  portfolioNames?: string[];
}

interface SearchResponse {
  success: boolean;
  data?: HelenaContact[];
  totalItems?: number;
  hasMorePages?: boolean;
  error?: string;
}

interface CreateResponse {
  success: boolean;
  data?: HelenaContact;
  error?: string;
}

export function useHelenaContactSearch(helenaCountId: string | null) {
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const searchContacts = async (name?: string, phoneNumber?: string): Promise<HelenaContact[]> => {
    if (!helenaCountId) {
      console.error('[useHelenaContactSearch] No helenaCountId provided');
      return [];
    }

    if (!name && !phoneNumber) {
      return [];
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke<SearchResponse>('helena-contact-search', {
        body: {
          action: 'search',
          helena_count_id: helenaCountId,
          name: name || undefined,
          phoneNumber: phoneNumber || undefined,
        },
      });

      if (error) {
        console.error('[useHelenaContactSearch] Search error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[useHelenaContactSearch] Search failed:', data?.error);
        throw new Error(data?.error || 'Search failed');
      }

      return data.data || [];
    } finally {
      setIsSearching(false);
    }
  };

  const createContact = async (name: string, phoneNumber: string): Promise<HelenaContact | null> => {
    if (!helenaCountId) {
      console.error('[useHelenaContactSearch] No helenaCountId provided');
      return null;
    }

    if (!name || !phoneNumber) {
      throw new Error('Name and phone number are required');
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke<CreateResponse>('helena-contact-search', {
        body: {
          action: 'create',
          helena_count_id: helenaCountId,
          name,
          phoneNumber,
        },
      });

      if (error) {
        console.error('[useHelenaContactSearch] Create error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('[useHelenaContactSearch] Create failed:', data?.error);
        throw new Error(data?.error || 'Create failed');
      }

      return data.data || null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    searchContacts,
    createContact,
    isSearching,
    isCreating,
  };
}
