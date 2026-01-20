import { Home, LayoutDashboard, LogOut, Shield, Lock, Package, UserCog, Brain, BarChart3, Settings, DollarSign, FileText, Activity, Bell, FileCheck, Calculator, Puzzle, Wrench } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useModulePermissions } from "@/hooks/useModulePermissions";
import { useWhatsAppData } from "@/context/WhatsAppDataContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
interface ModuleMenuItem {
  module_key: string;
  label: string;
  description: string | null;
  icon_name: string | null;
  route: string;
  category: string;
}

// Mapeamento de module_key para rotas
const moduleRouteMap: Record<string, string> = {
  dashboard: "/dashboard",
  chat: "/chat",
  contacts: "/contacts",
  crm: "/crm",
  calendar: "/calendar",
  process_campaigns: "/process-campaigns",
  campaigns: "/campaigns",
  connections: "/connections",
  webhook: "/webhook",
  settings: "/settings",
  help: "/help",
  team: "/team",
  agent_julia: "/agent_julia",
  "agent-analytics": "/agent-analytics",
  followup: "/followup",
  julia_agents: "/julia-agents",
  julia_performance: "/julia-performance",
  julia_contracts: "/julia-contracts"
};
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();
  const isOnChatPage = location.pathname === '/chat';
  const {
    isAdmin,
    signOut
  } = useAuth();
  const {
    hasPermission,
    loading: permissionsLoading
  } = useModulePermissions();
  const {
    totalUnreadCount
  } = useWhatsAppData();
  const [menuModules, setMenuModules] = useState<ModuleMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadMenuModules();
  }, []);
  const loadMenuModules = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('system_modules').select('module_key, label, description, icon_name, category').eq('is_active', true).order('display_order');
      if (error) throw error;
      const modules: ModuleMenuItem[] = (data || []).map(module => ({
        ...module,
        route: moduleRouteMap[module.module_key] || `/${module.module_key}`
      }));
      setMenuModules(modules);
    } catch (error) {
      console.error('Error loading menu modules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separar módulos em categorias
  const mainModules = menuModules.filter(m => 
    m.category === 'main' && 
    m.module_key !== 'dashboard' && 
    hasPermission(m.module_key)
  );
  const adminModules = menuModules.filter(m => 
    m.category === 'admin' && 
    isAdmin
  );
  const managementModules = menuModules.filter(m => 
    m.category === 'management' && 
    hasPermission(m.module_key)
  );
  
  const dashboardModule = menuModules.find(m => m.module_key === 'dashboard');
  const teamModule = menuModules.find(m => m.module_key === 'team');
  const analyticsModule = menuModules.find(m => m.module_key === 'agent-analytics');
  const settingsModule = menuModules.find(m => m.module_key === 'settings');
  const helpModule = menuModules.find(m => m.module_key === 'help');
  const getIcon = (iconName: string | null): React.ComponentType<any> => {
    if (!iconName) return Home;
    const Icon = (LucideIcons as any)[iconName];
    return Icon || Home;
  };
  if (loading || permissionsLoading) {
    return <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className={`border-b py-4 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <div className="flex items-center justify-center">
            <img src={isCollapsed ? logoIcon : logoFull} alt="Logo" className={isCollapsed ? "h-10 w-10 object-contain" : "h-12 w-auto"} />
          </div>
        </SidebarHeader>
        <SidebarContent className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <Button variant="outline" className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`} onClick={signOut}>
            <LogOut className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
            {!isCollapsed && <span>Sair</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>;
  }
  return <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className={`border-b py-4 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <div className="flex items-center justify-center">
            <img src={isCollapsed ? logoIcon : logoFull} alt="Logo" className={isCollapsed ? "h-10 w-10 object-contain" : "h-12 w-auto"} />
          </div>
        </SidebarHeader>
      
      <SidebarContent>
        {/* Menu Principal com módulos dinâmicos */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Mostra "Início" apenas para quem NÃO tem acesso ao dashboard */}
              {!hasPermission('dashboard') && <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/welcome" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Home className="h-4 w-4" />
                          <span>Início</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Início</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>}
              {dashboardModule && hasPermission('dashboard') && (() => {
                const IconComponent = getIcon(dashboardModule.icon_name);
                return <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink to={dashboardModule.route} className={({
                          isActive
                        }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                            <IconComponent className="h-4 w-4" />
                            <span>{dashboardModule.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{dashboardModule.label}</TooltipContent>}
                    </Tooltip>
                  </SidebarMenuItem>;
              })()}
              {mainModules.map(module => {
                const IconComponent = getIcon(module.icon_name);
                const isChat = module.module_key === 'chat';
                const showBadge = isChat && totalUnreadCount > 0 && !isOnChatPage;
                return <SidebarMenuItem key={module.module_key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink to={module.route} className={({
                          isActive
                        }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                            <IconComponent className="h-4 w-4" />
                            <span>{module.label}</span>
                            {showBadge && <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                              </span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{module.label}</TooltipContent>}
                    </Tooltip>
                  </SidebarMenuItem>;
              })}
              
              {/* Módulo Contratos da Julia */}
              {hasPermission('julia_contracts') && (
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/julia-contracts" className={({
                          isActive
                        }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <FileCheck className="h-4 w-4" />
                          <span>Contratos da Julia</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Contratos da Julia</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/clients" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Shield className="h-4 w-4" />
                          <span>Gerenciar Clientes</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Gerenciar Clientes</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/plans" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Package className="h-4 w-4" />
                          <span>Planos de Assinatura</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Planos de Assinatura</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/modules" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Package className="h-4 w-4" />
                          <span>Módulos do Sistema</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Módulos do Sistema</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/permissions" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Lock className="h-4 w-4" />
                          <span>Permissões de Acesso</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Permissões de Acesso</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/ai-models" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Brain className="h-4 w-4" />
                          <span>Modelos de IA</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Modelos de IA</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/asaas-config" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Settings className="h-4 w-4" />
                          <span>Configuração Asaas</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Configuração Asaas</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/billing" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <DollarSign className="h-4 w-4" />
                          <span>Gestão Financeira</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Gestão Financeira</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/system-notifications" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Bell className="h-4 w-4" />
                          <span>Notificações Sistema</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Notificações Sistema</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/subscription-requests" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <FileText className="h-4 w-4" />
                          <span>Pedidos de Assinatura</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Pedidos de Assinatura</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/webhook-logs" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Activity className="h-4 w-4" />
                          <span>Logs do Webhook</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Logs do Webhook</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/monitor-admin" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Activity className="h-4 w-4" />
                          <span>Monitor de Followup</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Monitor de Followup</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/modulos-extras" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Puzzle className="h-4 w-4" />
                          <span>Módulos Extras</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Módulos Extras</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/implementacao" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Wrench className="h-4 w-4" />
                          <span>Tipos de Implementação</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Tipos de Implementação</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/calculadora" className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                          <Calculator className="h-4 w-4" />
                          <span>Config. Calculadora</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">Config. Calculadora</TooltipContent>}
                  </Tooltip>
                </SidebarMenuItem>
                
                {/* Módulos dinâmicos de administração */}
                {adminModules.map(module => {
                  const IconComponent = getIcon(module.icon_name);
                  return <SidebarMenuItem key={module.module_key}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink to={module.route} className={({
                            isActive
                          }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                              <IconComponent className="h-4 w-4" />
                              <span>{module.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">{module.label}</TooltipContent>}
                      </Tooltip>
                    </SidebarMenuItem>;
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* Seção de Gerenciamento (Equipe e Analytics) */}
        {teamModule && hasPermission('team') || analyticsModule && hasPermission('agent-analytics') ? <SidebarGroup>
            <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {teamModule && hasPermission('team') && <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink to={teamModule.route} className={({
                        isActive
                      }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                            
                            <span>{teamModule.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{teamModule.label}</TooltipContent>}
                    </Tooltip>
                  </SidebarMenuItem>}
                {analyticsModule && hasPermission('agent-analytics') && (() => {
                const IconComponent = getIcon(analyticsModule.icon_name);
                return <SidebarMenuItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink to="/agent-analytics" className={({
                          isActive
                        }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                              <IconComponent className="h-4 w-4" />
                              <span>{analyticsModule.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && <TooltipContent side="right">{analyticsModule.label}</TooltipContent>}
                      </Tooltip>
                    </SidebarMenuItem>;
              })()}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup> : null}

        {/* Itens do rodapé (Settings e Help) */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsModule && hasPermission('settings') && (() => {
                const IconComponent = getIcon(settingsModule.icon_name);
                return <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink to={settingsModule.route} className={({
                          isActive
                        }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                            <IconComponent className="h-4 w-4" />
                            <span>{settingsModule.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{settingsModule.label}</TooltipContent>}
                    </Tooltip>
                  </SidebarMenuItem>;
              })()}
              {helpModule && hasPermission('help') && (() => {
                const IconComponent = getIcon(helpModule.icon_name);
                return <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton asChild>
                          <NavLink to={helpModule.route} className={({
                          isActive
                        }) => isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted"}>
                            <IconComponent className="h-4 w-4" />
                            <span>{helpModule.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && <TooltipContent side="right">{helpModule.label}</TooltipContent>}
                    </Tooltip>
                  </SidebarMenuItem>;
              })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`} onClick={signOut}>
              <LogOut className={`h-4 w-4 ${!isCollapsed ? 'mr-2' : ''}`} />
              {!isCollapsed && <span>Sair</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
    </TooltipProvider>;
}