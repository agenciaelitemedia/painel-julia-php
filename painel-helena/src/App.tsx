import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ModuleProtectedRoute } from "./components/ModuleProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { PublicAppProtectedRoute } from "./components/PublicAppProtectedRoute";
import { WhatsAppDataProvider } from "./context/WhatsAppDataContext";
import { SelectedCodAgentProvider } from "./context/SelectedCodAgentContext";

import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Contacts from "./pages/Contacts";
import CRM from "./pages/CRM";
import Connections from "./pages/Connections";
import WebhookConfig from "./pages/WebhookConfig";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import AdminClients from "./pages/AdminClients";
import ModulePermissions from "./pages/ModulePermissions";
import SystemModules from "./pages/SystemModules";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import AgentJulia from "./pages/AgentJulia";
import AIModelsConfig from "./pages/AIModelsConfig";
import AgentAnalytics from "./pages/AgentAnalytics";
import AgentConversations from "./pages/AgentConversations";
import Calendar from "./pages/Calendar";
import CalendarManagement from "./pages/CalendarManagement";
import PublicBooking from "./pages/PublicBooking";
import ProcessCampaigns from "./pages/ProcessCampaigns";
import Campaigns from "./pages/Campaigns";
import ClientBilling from "./pages/ClientBilling";
import AdminAsaasConfig from "./pages/AdminAsaasConfig";
import AdminBilling from "./pages/AdminBilling";
import AdminClientBilling from "./pages/AdminClientBilling";
import AdminPlans from "./pages/AdminPlans";
import AdminSubscriptionRequests from "./pages/AdminSubscriptionRequests";
import WebhookLogs from "./pages/WebhookLogs";
import FollowupConfig from "./pages/FollowupConfig";
import Followup from "./pages/Followup";
import FollowupDashboard from "./pages/FollowupDashboard";
import FollowupFunnel from "./pages/FollowupFunnel";
import MonitorAdmin from "./pages/MonitorAdmin";
import AdminSystemNotifications from "./pages/AdminSystemNotifications";
import JuliaAgents from "./pages/JuliaAgents";
import JuliaPerformance from "./pages/JuliaPerformance";
import PublicJuliaPerformance from "./pages/PublicJuliaPerformance";
import JuliaContracts from "./pages/JuliaContracts";
import PublicJulia from "./pages/PublicJulia";
import PublicAgentStatus from "./pages/PublicAgentStatus";
import PublicPriceCalculator from "./pages/PublicPriceCalculator";
import PublicCRMJulia from "./pages/PublicCRMJulia";
import PublicPopupMensagens from "./pages/PublicPopupMensagens";
import PublicAdminAgentsJulia from "./pages/PublicAdminAgentsJulia";
import AdminExtraModules from "./pages/AdminExtraModules";
import AdminImplementationTypes from "./pages/AdminImplementationTypes";
import AdminCalculatorSettings from "./pages/AdminCalculatorSettings";
import PublicTickets from "./pages/PublicTickets";
import PublicPopupTickets from "./pages/PublicPopupTickets";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <BrowserRouter>
        <AuthProvider>
          <SelectedCodAgentProvider>
            <WhatsAppDataProvider>
              <Routes>
              {/* Public routes - must come first */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/booking/:slug" element={<PublicBooking />} />
              
              {/* Protected routes with MainLayout */}
              <Route path="/welcome" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Welcome />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="dashboard">
                      <Dashboard />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="chat">
                      <Chat />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/contacts" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="contacts">
                      <Contacts />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/crm" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="crm">
                      <CRM />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="calendar">
                      <Calendar />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/calendar/manage" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="calendar">
                      <CalendarManagement />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/process-campaigns" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="process_campaigns">
                      <ProcessCampaigns />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/campaigns" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="campaigns">
                      <Campaigns />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/connections" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="connections">
                      <Connections />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/webhook" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="webhook">
                      <WebhookConfig />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/team" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="team">
                      <Team />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="settings">
                      <Settings />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/clients" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminClients />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/permissions" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <ModulePermissions />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/modules" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <SystemModules />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/help" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="help">
                      <Help />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/agent_julia" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="agent_julia">
                      <AgentJulia />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/agent-conversations/:agentId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="agent_julia">
                      <AgentConversations />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/followup" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="followup">
                      <Followup />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/followup-config/:configId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="followup">
                      <FollowupConfig />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/followup-dashboard/:configId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="followup">
                      <FollowupDashboard />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              
              <Route path="/followup-funnel/:configId" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="followup">
                      <FollowupFunnel />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/ai-models" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AIModelsConfig />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/agent-analytics" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="agent-analytics">
                      <AgentAnalytics />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/billing" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="billing">
                      <ClientBilling />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/asaas-config" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminAsaasConfig />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/billing" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminBilling />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/plans" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminPlans />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/modulos-extras" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminExtraModules />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/implementacao" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminImplementationTypes />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/calculadora" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminCalculatorSettings />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/clients/:clientId/billing" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminClientBilling />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/subscription-requests" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminSubscriptionRequests />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/webhook-logs" element={
                <ProtectedRoute>
                  <MainLayout>
                    <WebhookLogs />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/monitor-admin" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <MonitorAdmin />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/system-notifications" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <AdminSystemNotifications />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/julia-agents" element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminProtectedRoute>
                      <JuliaAgents />
                    </AdminProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/julia-performance" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="julia_performance">
                      <JuliaPerformance />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/app_desempenho-julia" element={
                <PublicAppProtectedRoute>
                  <PublicJuliaPerformance />
                </PublicAppProtectedRoute>
              } />
              
              <Route path="/app_julia" element={
                <PublicAppProtectedRoute>
                  <PublicJulia />
                </PublicAppProtectedRoute>
              } />
              
              <Route path="/app_crm_julia" element={<PublicCRMJulia />} />
               
              <Route path="/julia-contracts" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ModuleProtectedRoute module="julia_contracts">
                      <JuliaContracts />
                    </ModuleProtectedRoute>
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Public app routes without sync notifications */}
              <Route path="/app_agent_status" element={<PublicAgentStatus />} />
              <Route path="/app_calcula_precos" element={<PublicPriceCalculator />} />
              <Route path="/app_admin_agentes_julia" element={<PublicAdminAgentsJulia />} />
              <Route path="/app_popup_mensagens" element={<PublicPopupMensagens />} />
              <Route path="/app_tickets" element={<PublicTickets />} />
              <Route path="/app_popup_tickets" element={<PublicPopupTickets />} />
              
              {/* 404 route - must be last */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </WhatsAppDataProvider>
          </SelectedCodAgentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
