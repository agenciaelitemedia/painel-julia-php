import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserJuliaAgents } from '@/hooks/useUserJuliaAgents';

interface SelectedCodAgentContextType {
  selectedCodAgent: string | null;
  setSelectedCodAgent: (codAgent: string) => void;
  availableCodAgents: string[];
}

const SelectedCodAgentContext = createContext<SelectedCodAgentContextType | undefined>(undefined);

export function SelectedCodAgentProvider({ children }: { children: ReactNode }) {
  const { userAgents, defaultAgent } = useUserJuliaAgents();
  const [selectedCodAgent, setSelectedCodAgent] = useState<string | null>(null);

  // Inicializar com o cod_agent padrão
  useEffect(() => {
    if (defaultAgent && !selectedCodAgent) {
      setSelectedCodAgent(defaultAgent.cod_agent);
    }
  }, [defaultAgent, selectedCodAgent]);

  const availableCodAgents = userAgents?.map(a => a.cod_agent) || [];

  return (
    <SelectedCodAgentContext.Provider value={{ selectedCodAgent, setSelectedCodAgent, availableCodAgents }}>
      {children}
    </SelectedCodAgentContext.Provider>
  );
}

export const useSelectedCodAgent = () => {
  const context = useContext(SelectedCodAgentContext);
  if (!context) {
    throw new Error('useSelectedCodAgent must be used within SelectedCodAgentProvider');
  }
  return context;
};
