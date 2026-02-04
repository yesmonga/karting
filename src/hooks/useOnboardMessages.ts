import { useState, useEffect } from 'react';
import { onboardMessages, type OnboardMessage } from '@/lib/api';
import { MOCK_CONFIG, subscribeMockMessages } from '@/data/mockRaceData';

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

    // Polling for messages in real environment
    const fetchMessages = async () => {
      try {
        if (!sessionId) {
          console.warn('Skipping message poll: No sessionId provided');
          return;
        }

        console.log(`Polling messages for session: ${sessionId}`);
        const data = await onboardMessages.getBySession(sessionId);
        if (data && data.length > 0) {
          // Filter by kartNumber client-side if needed (API returns by session)
          const kartMessages = data.filter(m => m.kart_number === kartNumber);

          setMessages(kartMessages);
          if (kartMessages.length > 0) {
            setLatestMessage({
              text: kartMessages[0].text,
              timestamp: new Date(kartMessages[0].created_at),
            });
          }
        }
      } catch (error) {
        console.error('Error fetching onboard messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [kartNumber, sessionId]);

  return { messages, latestMessage };
}
