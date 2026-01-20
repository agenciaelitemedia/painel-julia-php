import { usePublicAppSecurity } from "@/hooks/usePublicAppSecurity";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function PublicAppProtectedRoute({ children }: Props) {
  const { isAuthorized, isLoading } = usePublicAppSecurity();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Já redirecionou para 404
  }

  return <>{children}</>;
}
