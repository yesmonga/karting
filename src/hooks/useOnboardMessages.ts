import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MOCK_CONFIG, subscribeMockMessages } from '@/data/mockRaceData';

interface OnboardMessage {
  id: string;
  kart_number: string;
  text: string;
  created_at: string;
  session_id: string | null;
}

export function useOnboardMessages(kartNumber: string, sessionId?: string) {
  const [messages, setMessages] = useState<OnboardMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<{ text: string; timestamp: Date } | null>(null);

  useEffect(() => {
    if (!kartNumber) return;

    // Mode mock : écouter les messages via API (cross-device)
    if (MOCK_CONFIG.enabled) {
      // S'abonner aux nouveaux messages (polling API)
      const unsubscribe = subscribeMockMessages((message) => {
        setLatestMessage(message);
      });
      
      return unsubscribe;
    }

    // Charger les messages récents
    const loadMessages = async () => {
      let query = supabase
        .from('onboard_messages')
        .select('*')
        .eq('kart_number', kartNumber)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data } = await query;

      if (data && data.length > 0) {
        setMessages(data);
        setLatestMessage({
          text: data[0].text,
          timestamp: new Date(data[0].created_at),
        });
      }
    };

    loadMessages();

    // Écouter les nouveaux messages en temps réel
    const channel: RealtimeChannel = supabase
      .channel(`onboard-${kartNumber}-${sessionId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'onboard_messages',
          filter: `kart_number=eq.${kartNumber}`,
        },
        (payload) => {
          const newMessage = payload.new as OnboardMessage;
          // Filtrer par session si spécifié
          if (sessionId && newMessage.session_id !== sessionId) return;
          
          setMessages((prev) => [newMessage, ...prev]);
          setLatestMessage({
            text: newMessage.text,
            timestamp: new Date(newMessage.created_at),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kartNumber, sessionId]);

  return { messages, latestMessage };
}
