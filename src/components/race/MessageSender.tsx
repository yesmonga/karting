import { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { onboardMessages } from '@/lib/api';
import { toast } from 'sonner';
import { MOCK_CONFIG, sendMockMessage } from '@/data/mockRaceData';

interface MessageSenderProps {
  kartNumber: string;
  sessionId?: string;
}

const QUICK_MESSAGES = [
  'BOX BOX',
  'PUSH PUSH',
  'STAY OUT',
  'SAVE FUEL',
  'ATTACK',
  'DEFEND',
  '+1 TOUR',
  'COOL DOWN',
  'PIT NOW',
  'IGNORE BLUE',
];

export function MessageSender({ kartNumber, sessionId }: MessageSenderProps) {
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (text: string) => {
    if (!kartNumber || !text.trim()) return;

    setSending(true);
    try {
      // Mode mock : envoi local instantané
      if (MOCK_CONFIG.enabled) {
        sendMockMessage(text.trim());
        toast.success(`Message envoyé au Kart #${kartNumber}`);
        setCustomMessage('');
        setSending(false);
        return;
      }

      await onboardMessages.create({
        kart_number: kartNumber,
        text: text.trim().toUpperCase(),
        session_id: sessionId,
      });

      toast.success(`Message envoyé au Kart #${kartNumber}`);
      setCustomMessage('');
    } catch (err) {
      toast.error('Erreur envoi message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-racing">
          <MessageSquare className="w-4 h-4 text-primary" />
          Message → Kart #{kartNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages rapides */}
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_MESSAGES.map((msg) => (
            <Button
              key={msg}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(msg)}
              disabled={sending || !kartNumber}
              className="text-[10px] px-1 py-1 h-auto"
            >
              {msg}
            </Button>
          ))}
        </div>

        {/* Message personnalisé */}
        <div className="flex gap-2">
          <Input
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Message personnalisé..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(customMessage)}
            disabled={!kartNumber}
            className="text-sm"
          />
          <Button
            size="icon"
            onClick={() => sendMessage(customMessage)}
            disabled={sending || !kartNumber || !customMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
