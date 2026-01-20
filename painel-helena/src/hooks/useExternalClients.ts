import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/constants/countries";

export interface ExternalClient {
  id: number;
  name: string;
  business_name: string | null;
  federal_id: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zip_code: string | null;
  created_at: string;
}

export interface CreateClientData {
  name: string;
  business_name?: string;
  federal_id?: string;
  email: string;
  phone: string;
  country: string;
  state?: string;
  city: string;
  zip_code?: string;
}

interface ExternalDbQueryResponse {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

// Helper to get full phone with DDI
const getFullPhoneForDatabase = (phone: string, country: string): string => {
  const countryData = COUNTRIES.find(c => c.value === country);
  const ddi = countryData?.ddi.replace('+', '') || '55';
  const cleanNumber = phone.replace(/\D/g, '');
  // If phone already starts with DDI, don't add it again
  if (cleanNumber.startsWith(ddi)) {
    return cleanNumber;
  }
  return `${ddi}${cleanNumber}`;
};

// Helper to clean masks from values
const cleanMask = (value: string | undefined): string | null => {
  if (!value) return null;
  const cleaned = value.replace(/\D/g, '');
  return cleaned || null;
};

export const useExternalClients = (searchTerm?: string) => {
  return useQuery<ExternalClient[], Error>({
    queryKey: ['external-clients', searchTerm],
    queryFn: async () => {
      let query = `
        SELECT id, name, business_name, federal_id, email, phone, country, state, city, zip_code, created_at
        FROM public.clients
      `;
      
      const params: any[] = [];
      
      if (searchTerm && searchTerm.length >= 2) {
        query += ` WHERE LOWER(name) LIKE $1 OR LOWER(business_name) LIKE $1 OR LOWER(email) LIKE $1`;
        params.push(`%${searchTerm.toLowerCase()}%`);
      }
      
      query += ` ORDER BY name ASC LIMIT 50`;
      
      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query, params } }
      );

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch clients');
      }

      return data.data as ExternalClient[];
    },
    staleTime: 30000,
  });
};

export const useCreateExternalClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: CreateClientData): Promise<ExternalClient> => {
      // Clean and prepare data for database
      const cleanPhone = getFullPhoneForDatabase(clientData.phone, clientData.country);
      const cleanFederalId = cleanMask(clientData.federal_id);
      const cleanZipCode = cleanMask(clientData.zip_code);
      
      const query = `
        INSERT INTO public.clients (name, business_name, federal_id, email, phone, country, state, city, zip_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name, business_name, federal_id, email, phone, country, state, city, zip_code, created_at
      `;
      
      const params = [
        clientData.name,
        clientData.business_name || null,
        cleanFederalId,
        clientData.email,
        cleanPhone,
        clientData.country, // Already a 2-letter code
        clientData.state || null,
        clientData.city,
        cleanZipCode,
      ];
      
      const { data, error } = await supabase.functions.invoke<ExternalDbQueryResponse>(
        'public-external-db-query',
        { body: { query, params } }
      );

      if (error || !data?.success || !data.data?.[0]) {
        throw new Error(data?.error || error?.message || 'Failed to create client');
      }

      return data.data[0] as ExternalClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-clients'] });
    },
    onError: (error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    }
  });
};
