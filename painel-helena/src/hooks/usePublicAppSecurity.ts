import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface PublicAppSecurityResult {
  isAuthorized: boolean | null;
  isLoading: boolean;
  sessionToken: string | null;
  countId: string | null;
  userId: string | null;
  whatsappNumber: string | null;
  contactId: string | null;
  timestamp: string | null;
  refreshToken: () => void;
  generateFreshToken: () => string | null;
}

export const usePublicAppSecurity = (): PublicAppSecurityResult => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  // Timestamp dinâmico para renovação do token
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<number>(Date.now());

  // Extrair parâmetros da URL (com fallback para desenvolvimento)
  const hostname = window.location.hostname;
  const isDevelopment = hostname === "localhost" || 
                        hostname === "127.0.0.1" ||
                        hostname.includes("lovable") ||
                        hostname.includes("gptengineer") ||
                        hostname.includes("preview") ||
                        hostname.includes("sslip.io") ||
                        hostname.includes("dev");
  
  const countId = searchParams.get('count_id') || (isDevelopment ? 'b64d54c1-65b6-4ea8-9ade-ecd87cfe4e3f' : null);
  const userId = searchParams.get('user_id') || (isDevelopment ? '98df6018-ee57-402d-a9fb-3476a54c2c15' : null);
  const whatsappNumber = searchParams.get('number') || (isDevelopment ? '5534991460643' : null);
  const contactId = searchParams.get('contact_id') || (isDevelopment ? '51fb87ce-8691-497e-bed5-339b00757e70' : null);
  const sessionTimestamp = searchParams.getAll('timestamp')[0] || Date.now().toString();
  
  // Check if current route is app_popup_tickets or app_crm_julia (bypass timestamp validation)
  const currentPath = window.location.pathname;
  const isPopupTicketsRoute = currentPath.includes('app_popup_tickets');
  const isCRMJuliaRoute = currentPath.includes('app_crm_julia');

  // Validação de segurança
  useEffect(() => {
    const validateAccess = () => {
      const referrer = document.referrer;
      const allowedDomain = "atendejulia.com.br";
      const hostname = window.location.hostname;
      
      // Em desenvolvimento, permitir acesso (localhost, lovable, ou preview)
      const isDevelopment = hostname === "localhost" || 
                            hostname === "127.0.0.1" ||
                            hostname.includes("lovable") ||
                            hostname.includes("gptengineer") ||
                            hostname.includes("preview") ||
                            hostname.includes("sslip.io") ||
                            hostname.includes("dev");
      
      console.log("[Security] Hostname:", hostname, "isDevelopment:", isDevelopment);
      
      if (isDevelopment) {
        console.log("[Security] Development mode - access allowed");
        setIsAuthorized(true);
        return;
      }

      // 1. Validar timestamp (obrigatório, exceto para rotas específicas)
      if (!sessionTimestamp && !isPopupTicketsRoute && !isCRMJuliaRoute) {
        console.warn("[Security] Missing session timestamp");
        setIsAuthorized(false);
        navigate('/404', { replace: true });
        return;
      }
      
      // For popup tickets route, allow access if count_id and user_id are present
      if (isPopupTicketsRoute && countId && userId) {
        console.log("[Security] Popup tickets route - access allowed with count_id and user_id");
        setIsAuthorized(true);
        return;
      }
      
      // For CRM Julia route, allow access if count_id and user_id are present
      if (isCRMJuliaRoute && countId && userId) {
        console.log("[Security] CRM Julia route - access allowed with count_id and user_id");
        setIsAuthorized(true);
        return;
      }

      const tokenTime = parseInt(sessionTimestamp, 10);
      const currentTime = Date.now();
      const recentThreshold = 30 * 1000; // 30 segundos
      
      // Validar que o timestamp é válido (não expirar a sessão depois)
      if (isNaN(tokenTime)) {
        console.warn("[Security] Invalid session timestamp");
        setIsAuthorized(false);
        navigate('/404', { replace: true });
        return;
      }

      // 2. Validar referrer (com fallback para timestamp recente na primeira visita)
      const isValidReferrer = referrer.includes(allowedDomain);
      const isRecentTimestamp = currentTime - tokenTime < recentThreshold;
      
      // Permitir se referrer válido OU timestamp muito recente (< 30s) na primeira visita
      if (!isValidReferrer && !isRecentTimestamp) {
        console.warn("[Security] Invalid referrer and timestamp not recent enough:", { referrer, age: currentTime - tokenTime });
        setIsAuthorized(false);
        navigate('/404', { replace: true });
        return;
      }

      console.log("[Security] All validations passed");
      setIsAuthorized(true);
    };

    validateAccess();
  }, [navigate, sessionTimestamp]);

  // Função para gerar token fresco a cada requisição
  const generateFreshToken = useCallback(() => {
    if (!sessionTimestamp) return null;
    return btoa(`${Date.now()}:${countId || 'public'}`);
  }, [countId, sessionTimestamp]);

  // Manter compatibilidade com código existente
  const sessionToken = useMemo(() => {
    if (!sessionTimestamp) return null;
    return btoa(`${Date.now()}:${countId || 'public'}`);
  }, [countId, sessionTimestamp]);

  const refreshToken = useCallback(() => {
    setLastActivityTimestamp(Date.now());
  }, []);

  return {
    isAuthorized,
    isLoading: isAuthorized === null,
    sessionToken,
    countId,
    userId,
    whatsappNumber,
    contactId,
    timestamp: sessionTimestamp,
    refreshToken,
    generateFreshToken,
  };
};
