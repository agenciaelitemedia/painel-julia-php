import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface ExtraModule {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_name: string | null;
  has_quantity: boolean | null;
  quantity_label: string | null;
  price_per_unit: number | null;
  base_quantity: number | null;
  max_quantity: number | null;
  display_order: number | null;
  is_active: boolean | null;
}

export interface ImplementationType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  included_items: string[] | null;
  badge_text: string | null;
  badge_color: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

export interface CalculatorSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

// Extra Modules Hooks
export function useAdminExtraModules() {
  return useQuery({
    queryKey: ["admin-extra-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extra_modules")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ExtraModule[];
    },
  });
}

export function useCreateExtraModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (module: Omit<ExtraModule, "id">) => {
      const { data, error } = await supabase
        .from("extra_modules")
        .insert(module)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-extra-modules"] });
      toast.success("Módulo criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar módulo: " + error.message);
    },
  });
}

export function useUpdateExtraModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...module }: Partial<ExtraModule> & { id: string }) => {
      const { data, error } = await supabase
        .from("extra_modules")
        .update(module)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-extra-modules"] });
      toast.success("Módulo atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar módulo: " + error.message);
    },
  });
}

export function useDeleteExtraModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("extra_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-extra-modules"] });
      toast.success("Módulo excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir módulo: " + error.message);
    },
  });
}

// Implementation Types Hooks
export function useAdminImplementationTypes() {
  return useQuery({
    queryKey: ["admin-implementation-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementation_types")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ImplementationType[];
    },
  });
}

export function useCreateImplementationType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: Omit<ImplementationType, "id">) => {
      const { data, error } = await supabase
        .from("implementation_types")
        .insert(type)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-implementation-types"] });
      toast.success("Tipo de implementação criado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar tipo: " + error.message);
    },
  });
}

export function useUpdateImplementationType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...type }: Partial<ImplementationType> & { id: string }) => {
      const { data, error } = await supabase
        .from("implementation_types")
        .update(type)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-implementation-types"] });
      toast.success("Tipo de implementação atualizado com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tipo: " + error.message);
    },
  });
}

export function useDeleteImplementationType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("implementation_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-implementation-types"] });
      toast.success("Tipo de implementação excluído com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao excluir tipo: " + error.message);
    },
  });
}

// Calculator Settings Hooks
export function useAdminCalculatorSettings() {
  return useQuery({
    queryKey: ["admin-calculator-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculator_settings")
        .select("*")
        .order("setting_key", { ascending: true });
      if (error) throw error;
      return data as CalculatorSetting[];
    },
  });
}

export function useUpdateCalculatorSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, setting_value }: { id: string; setting_value: any }) => {
      const { data, error } = await supabase
        .from("calculator_settings")
        .update({ setting_value })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-calculator-settings"] });
      toast.success("Configuração atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar configuração: " + error.message);
    },
  });
}
