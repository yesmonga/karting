import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeShareProps {
  sessionId: string;
  teamName: string;
  kartNumber: string;
}

export function QRCodeShare({ sessionId, teamName, kartNumber }: QRCodeShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Generate public spectator URL
  const spectatorUrl = `${window.location.origin}/spectator/${sessionId}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(spectatorUrl);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Partager la course
          </DialogTitle>
          <DialogDescription>
            Scannez ce QR code pour suivre le Kart #{kartNumber} ({teamName}) en temps réel
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG 
              value={spectatorUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          
          {/* URL display and copy */}
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm truncate">
              {spectatorUrl}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Les spectateurs peuvent voir les infos de course sans créer de compte
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
