import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  client_id: string | null;
  role: 'admin' | 'client' | 'team_member';
  full_name: string | null;
  is_team_member?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        // Detectar sessão expirada ou erro de token
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          
          // Redirecionar para login se não estiver já na página de auth
          if (window.location.pathname !== '/auth') {
            toast.error('Sua sessão expirou. Faça login novamente.');
            navigate('/auth');
          }
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            // Verificar se é team member
            const { data: teamMember } = await supabase
              .from('team_members')
              .select('id')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            setProfile(profileData ? { ...profileData, is_team_member: !!teamMember } : null);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        
        // Redirecionar para login se houver erro ao buscar sessão
        if (window.location.pathname !== '/auth') {
          toast.error('Erro ao recuperar sessão. Faça login novamente.');
          navigate('/auth');
        }
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(async ({ data }) => {
            // Verificar se é team member
            const { data: teamMember } = await supabase
              .from('team_members')
              .select('id')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            setProfile(data ? { ...data, is_team_member: !!teamMember } : null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Mensagens de erro de autenticação em português
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos');
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('Email não confirmado');
        }
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao autenticar usuário');
      }

      // Verificar status ANTES de permitir o login completo
      // 1. Verificar se é um team member
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('is_active, client_id, clients(is_active)')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (teamMember) {
        // Verificar se o team member está desabilitado
        if (!teamMember.is_active) {
          await supabase.auth.signOut();
          throw new Error('Sua conta de membro está desabilitada. Entre em contato com o administrador.');
        }

        // Verificar se o cliente do team member está desabilitado
        const clientData = teamMember.clients as any;
        if (clientData && !clientData.is_active) {
          await supabase.auth.signOut();
          throw new Error('O cliente associado à sua conta está desabilitado. Entre em contato com o administrador.');
        }
      } else {
        // 2. Verificar se é um cliente
        const { data: userData } = await supabase
          .from('users')
          .select('client_id, clients(is_active)')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userData?.client_id) {
          const clientData = userData.clients as any;
          if (clientData && !clientData.is_active) {
            await supabase.auth.signOut();
            throw new Error('Sua conta de cliente está desabilitada. Entre em contato com o administrador.');
          }
        }
      }
      
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      // Exibir erro em vermelho (toast.error já é vermelho por padrão)
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      toast.success('Conta criada com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Limpar tokens de autenticação do Supabase do storage local
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-') && (key.endsWith('-auth-token') || key.endsWith('-provider-token')))
        .forEach((key) => localStorage.removeItem(key));

      // Limpar estado do app
      setUser(null);
      setSession(null);
      setProfile(null);

      // Forçar reload para garantir que o cliente não reidrate a sessão
      toast.success('Logout realizado com sucesso!');
      window.location.replace('/auth');
    } catch (error: any) {
      // Mesmo em caso de erro, garantir limpeza local e redirecionamento
      Object.keys(localStorage)
        .filter((key) => key.startsWith('sb-'))
        .forEach((key) => localStorage.removeItem(key));

      setUser(null);
      setSession(null);
      setProfile(null);
      window.location.replace('/auth');
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}