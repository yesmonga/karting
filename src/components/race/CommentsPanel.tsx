import { MessageSquare, AlertTriangle, Flag, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Comment {
  time: string;
  text: string;
  kart?: string;
}

interface CommentsPanelProps {
  comments: Comment[];
  maxHeight?: number;  // en pixels
}

function getCommentType(text: string) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('pénalité') || lowerText.includes('penalite') || lowerText.includes('penalty')) {
    return {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/30',
    };
  }
  
  if (lowerText.includes('avertissement') || lowerText.includes('warning') || lowerText.includes('contact')) {
    return {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    };
  }
  
  if (lowerText.includes('départ') || lowerText.includes('start') || lowerText.includes('go')) {
    return {
      icon: <Flag className="w-4 h-4" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30',
    };
  }
  
  return {
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
  };
}

function extractKartFromText(text: string): { kart?: string; cleanText: string } {
  const kartMatch = text.match(/^(\d{1,2})\s*[-–]?\s*(.+)/);
  if (kartMatch) {
    return { kart: kartMatch[1], cleanText: kartMatch[2].trim() };
  }
  return { cleanText: text };
}

// Fonction pour trier par heure (plus récent en premier)
function sortByTimeDesc(comments: Comment[]): Comment[] {
  return [...comments].sort((a, b) => {
    // Convertir "16:09" en minutes pour comparer
    const [aH, aM] = a.time.split(':').map(Number);
    const [bH, bM] = b.time.split(':').map(Number);
    const aMinutes = (aH || 0) * 60 + (aM || 0);
    const bMinutes = (bH || 0) * 60 + (bM || 0);
    return bMinutes - aMinutes;  // Décroissant (plus récent en premier)
  });
}

export function CommentsPanel({ comments, maxHeight = 250 }: CommentsPanelProps) {
  if (!comments || comments.length === 0) {
    return (
      <Card className="glass-card animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="font-racing flex items-center gap-2 text-base">
            <MessageSquare className="w-5 h-5 text-primary" />
            Commentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            Aucun commentaire pour le moment...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Traiter et TRIER les commentaires (plus récent en premier)
  const processedComments = sortByTimeDesc(comments).map((comment) => {
    const extracted = extractKartFromText(comment.text);
    return {
      ...comment,
      kart: comment.kart || extracted.kart,
      text: extracted.cleanText || comment.text,
    };
  });

  return (
    <Card className="glass-card animate-slide-up">
      <CardHeader className="pb-2">
        <CardTitle className="font-racing flex items-center gap-2 text-base">
          <MessageSquare className="w-5 h-5 text-primary" />
          Commentaires
          <Badge variant="secondary" className="ml-auto">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* DIV avec overflow-y-auto et max-height fixe */}
        <div 
          className="overflow-y-auto px-4 pb-4"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <div className="space-y-2 pt-2">
            {processedComments.map((comment, index) => {
              const { icon, color, bgColor } = getCommentType(comment.text);
              
              return (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:scale-[1.01] ${bgColor}`}
                >
                  <div className={`mt-0.5 ${color}`}>
                    {icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {comment.time}
                      </span>
                      
                      {comment.kart && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          <User className="w-3 h-3 mr-1" />
                          Kart {comment.kart}
                        </Badge>
                      )}
                    </div>
                    
                    <p className={`text-sm mt-1 ${color}`}>
                      {comment.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
