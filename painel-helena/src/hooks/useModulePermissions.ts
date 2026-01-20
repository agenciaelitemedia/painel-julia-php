import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SystemModule = string;

export function useModulePermissions() {
  const { user, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModulesAndPermissions();
  }, [user, isAdmin]);

  const loadModulesAndPermissions = async () => {
    try {
      setLoading(true);

      // Buscar módulos ativos do sistema
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('module_key')
        .eq('is_active', true)
        .order('display_order');

      if (modulesError) throw modulesError;

      const moduleKeys = modulesData?.map(m => m.module_key) || [];
      setModules(moduleKeys);

      if (!user) {
        setPermissions(new Set());
        setLoading(false);
        return;
      }

      // Admins têm acesso a tudo
      if (isAdmin) {
        setPermissions(new Set(moduleKeys));
        setLoading(false);
        return;
      }

      // Verificar permissões do usuário
      await checkPermissions(moduleKeys);
    } catch (error) {
      console.error('Error loading modules:', error);
      setLoading(false);
    }
  };

  const checkPermissions = async (moduleKeys: string[]) => {
    if (!user) return;

    try {
      const permissionChecks = await Promise.all(
        moduleKeys.map(async (module) => {
          const { data, error } = await supabase.rpc('user_has_module_permission', {
            _user_id: user.id,
            _module: module as any,
          });

          if (error) {
            console.error(`Error checking permission for ${module}:`, error);
            return { module, hasPermission: false };
          }

          return { module, hasPermission: data === true };
        })
      );

      const allowedModules = new Set(
        permissionChecks
          .filter(({ hasPermission }) => hasPermission)
          .map(({ module }) => module)
      );

      setPermissions(allowedModules);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: string): boolean => {
    return isAdmin || permissions.has(module);
  };

  return { permissions, hasPermission, loading, modules };
}
