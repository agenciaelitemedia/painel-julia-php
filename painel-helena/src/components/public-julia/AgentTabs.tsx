import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, FileText, Settings, FileSignature } from "lucide-react";
import { AgentInfoTab } from "./AgentInfoTab";
import { AgentCasesTab } from "./AgentCasesTab";
import { AgentSettingsTab } from "./AgentSettingsTab";
import { ContractTemplatesTab } from "./ContractTemplatesTab";

interface AgentTabsProps {
  codAgent: string;
  sessionToken: string | null;
  generateFreshToken: (() => string | null) | null;
}

export function AgentTabs({ codAgent, sessionToken, generateFreshToken }: AgentTabsProps) {
  return (
    <Tabs defaultValue="info" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="info" className="gap-2">
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Informações do Agent</span>
          <span className="sm:hidden">Info</span>
        </TabsTrigger>
        <TabsTrigger value="cases" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Casos Jurídicos e Campanhas</span>
          <span className="sm:hidden">Casos</span>
        </TabsTrigger>
        <TabsTrigger value="templates" className="gap-2">
          <FileSignature className="h-4 w-4" />
          <span className="hidden sm:inline">Templates de Contratos</span>
          <span className="sm:hidden">Templates</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Configurações</span>
          <span className="sm:hidden">Config</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <AgentInfoTab 
          codAgent={codAgent} 
          sessionToken={sessionToken} 
          generateFreshToken={generateFreshToken}
        />
      </TabsContent>

      <TabsContent value="cases">
        <AgentCasesTab 
          codAgent={codAgent} 
          sessionToken={sessionToken} 
          generateFreshToken={generateFreshToken}
        />
      </TabsContent>

      <TabsContent value="templates">
        <ContractTemplatesTab 
          codAgent={codAgent}
          sessionToken={sessionToken}
          generateFreshToken={generateFreshToken}
        />
      </TabsContent>

      <TabsContent value="settings">
        <AgentSettingsTab 
          codAgent={codAgent}
          sessionToken={sessionToken}
          generateFreshToken={generateFreshToken}
        />
      </TabsContent>
    </Tabs>
  );
}
