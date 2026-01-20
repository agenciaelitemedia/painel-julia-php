import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DashboardStats {
  todayContacts: number;
  todayMessages: number;
  todayChats: number;
  connectedInstances: number;
  todayMessagesChange?: number;
  todayChatsChange?: number;
  todayContactsChange?: number;
}

interface HourlyData {
  hour: string;
  messages: number;
}

interface DailyData {
  date: string;
  messages: number;
}

interface RecentChat {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
  lastMessageTime: string;
  lastMessage: string;
}

export function useDashboardData() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayContacts: 0,
    todayMessages: 0,
    todayChats: 0,
    connectedInstances: 0,
    todayMessagesChange: 0,
    todayChatsChange: 0,
    todayContactsChange: 0,
  });
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.client_id) {
      fetchDashboardData();
    }
  }, [profile?.client_id]);

  const fetchDashboardData = async () => {
    if (!profile?.client_id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const last24h = new Date();
      last24h.setHours(last24h.getHours() - 24);

      // Executar todas as queries em paralelo para melhor performance
      const [
        { count: todayContactsCount },
        { count: todayMessagesCount },
        { count: yesterdayMessagesCount },
        { count: yesterdayContactsCount },
        { count: connectedCount },
        { data: todayChatsMessages },
        { data: yesterdayChatsMessages },
        { data: messagesData },
        { data: hourlyMessages },
      ] = await Promise.all([
        // Contatos criados hoje
        supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', profile.client_id)
          .eq('is_archived', false)
          .eq('is_group', false)
          .gte('created_at', today.toISOString()),

        // Mensagens de hoje
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', profile.client_id)
          .gte('timestamp', today.toISOString()),

        // Mensagens de ontem
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', profile.client_id)
          .gte('timestamp', yesterday.toISOString())
          .lt('timestamp', today.toISOString()),

        // Contatos criados ontem
        supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', profile.client_id)
          .eq('is_archived', false)
          .eq('is_group', false)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString()),

        // Instâncias conectadas
        supabase
          .from('whatsapp_instances')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', profile.client_id)
          .eq('status', 'connected'),

        // Conversas de hoje (contact_ids)
        supabase
          .from('messages')
          .select('contact_id')
          .eq('client_id', profile.client_id)
          .gte('timestamp', today.toISOString()),

        // Conversas de ontem (contact_ids)
        supabase
          .from('messages')
          .select('contact_id')
          .eq('client_id', profile.client_id)
          .gte('timestamp', yesterday.toISOString())
          .lt('timestamp', today.toISOString()),

        // Mensagens recentes para conversas
        supabase
          .from('messages')
          .select('contact_id, text, timestamp')
          .eq('client_id', profile.client_id)
          .order('timestamp', { ascending: false })
          .limit(100),

        // Mensagens das últimas 24h para gráfico
        supabase
          .from('messages')
          .select('timestamp')
          .eq('client_id', profile.client_id)
          .gte('timestamp', last24h.toISOString()),
      ]);

      // Processar conversas recentes
      const contactIds = [...new Set(messagesData?.map(m => m.contact_id) || [])];
      const uniqueContactIds = contactIds.slice(0, 5);

      if (uniqueContactIds.length > 0) {
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('id, name, phone, avatar')
          .in('id', uniqueContactIds);

        const chatsWithMessages = (contactsData || []).map(contact => {
          const lastMsg = messagesData?.find(m => m.contact_id === contact.id);
          return {
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            avatar: contact.avatar,
            lastMessageTime: lastMsg?.timestamp || '',
            lastMessage: lastMsg?.text || '',
          };
        });

        setRecentChats(chatsWithMessages);
      }

      // Contar conversas únicas
      const todayChatsSet = new Set(todayChatsMessages?.map(m => m.contact_id) || []);
      const yesterdayChatsSet = new Set(yesterdayChatsMessages?.map(m => m.contact_id) || []);

      // Processar dados por hora
      const hourCounts = new Map<number, number>();
      for (let i = 0; i < 24; i++) {
        hourCounts.set(i, 0);
      }
      
      hourlyMessages?.forEach(msg => {
        const hour = new Date(msg.timestamp).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });

      const hourlyDataArray: HourlyData[] = Array.from(hourCounts.entries()).map(([hour, count]) => ({
        hour: `${hour.toString().padStart(2, '0')}h`,
        messages: count,
      }));

      // Buscar dados diários em paralelo
      const dailyPromises = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        dailyPromises.push(
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', profile.client_id)
            .gte('timestamp', date.toISOString())
            .lt('timestamp', nextDate.toISOString())
            .then(({ count }) => {
              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);
              const isToday = date.toISOString().split('T')[0] === todayDate.toISOString().split('T')[0];
              
              return {
                date: isToday ? 'Hoje' : date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }),
                messages: count || 0,
              };
            })
        );
      }

      const dailyDataArray = await Promise.all(dailyPromises);

      // Calcular mudanças percentuais
      const todayMessagesChange = yesterdayMessagesCount && yesterdayMessagesCount > 0
        ? ((((todayMessagesCount || 0) - yesterdayMessagesCount) / yesterdayMessagesCount) * 100)
        : 0;

      const todayChatsChange = yesterdayChatsSet.size > 0
        ? (((todayChatsSet.size - yesterdayChatsSet.size) / yesterdayChatsSet.size) * 100)
        : 0;

      const todayContactsChange = yesterdayContactsCount && yesterdayContactsCount > 0
        ? ((((todayContactsCount || 0) - yesterdayContactsCount) / yesterdayContactsCount) * 100)
        : 0;

      setStats({
        todayContacts: todayContactsCount || 0,
        todayMessages: todayMessagesCount || 0,
        todayChats: todayChatsSet.size,
        connectedInstances: connectedCount || 0,
        todayMessagesChange,
        todayChatsChange,
        todayContactsChange,
      });
      setHourlyData(hourlyDataArray);
      setDailyData(dailyDataArray);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, recentChats, hourlyData, dailyData, loading, refresh: fetchDashboardData };
}
