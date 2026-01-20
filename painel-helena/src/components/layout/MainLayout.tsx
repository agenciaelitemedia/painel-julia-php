import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useClientData } from "@/hooks/useClientData";
import { Building2, User, UserCog } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelectedCodAgent } from "@/context/SelectedCodAgentContext";

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function MainLayout({ children, showHeader = true }: MainLayoutProps) {
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";
  const { profile } = useAuth();
  const { clientData } = useClientData();
  const { selectedCodAgent, setSelectedCodAgent, availableCodAgents } = useSelectedCodAgent();
  
  const isAdmin = profile?.role === 'admin';

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {showHeader && (
            <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-6 shadow-sm flex-shrink-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              <div className="flex items-center gap-4">
                {clientData && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-semibold uppercase">
                      {clientData.name}
                    </p>
                  </div>
                )}
                {!isAdmin && availableCodAgents.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedCodAgent || ''} onValueChange={setSelectedCodAgent}>
                      <SelectTrigger className="w-[180px] h-8 border-none bg-transparent">
                        <SelectValue placeholder="Selecione agente" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCodAgents.map(cod => (
                          <SelectItem key={cod} value={cod}>
                            {cod}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {profile?.full_name && (
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {profile.full_name}
                    </p>
                  </NavLink>
                )}
              </div>
            </header>
          )}
          <main className={cn(
            "flex-1 p-6",
            isChatPage ? "overflow-hidden" : "overflow-auto"
          )}>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
