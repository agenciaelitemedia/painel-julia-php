import { Navigate } from 'react-router-dom';
import { useModulePermissions, SystemModule } from '@/hooks/useModulePermissions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface ModuleProtectedRouteProps {
  children: React.ReactNode;
  module: SystemModule;
}

export function ModuleProtectedRoute({ children, module }: ModuleProtectedRouteProps) {
  const { hasPermission, loading } = useModulePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPermission(module)) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}
