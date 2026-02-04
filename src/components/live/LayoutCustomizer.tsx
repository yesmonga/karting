import { useState } from 'react';
import { Paintbrush, GripVertical, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose 
} from '@/components/ui/sheet';
import { SectionConfig, SectionId } from '@/hooks/useLayoutCustomizer';
import { cn } from '@/lib/utils';

interface LayoutCustomizerProps {
  sections: SectionConfig[];
  onMoveSection: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (id: SectionId) => void;
  onReset: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LayoutCustomizer({
  sections,
  onMoveSection,
  onToggleVisibility,
  onReset,
  isOpen,
  onOpenChange,
}: LayoutCustomizerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onMoveSection(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          title="Personnaliser le layout"
        >
          <Paintbrush className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 glass-card border-r border-border/30">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-racing flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-primary" />
            Personnaliser
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-4">
            Glissez-déposez pour réorganiser les sections. Cliquez sur l'œil pour masquer/afficher.
          </p>
          
          {sections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/30 cursor-grab active:cursor-grabbing transition-all",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index && "border-primary bg-primary/10"
              )}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className={cn(
                "flex-1 text-sm font-medium",
                !section.visible && "text-muted-foreground line-through"
              )}>
                {section.label}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onToggleVisibility(section.id)}
              >
                {section.visible ? (
                  <Eye className="w-4 h-4 text-green-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
