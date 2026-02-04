import { useState, useCallback } from 'react';
import { Upload, FileText, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  file: File;
  type: 'classement' | 'historique' | 'arrets' | 'tours' | 'unknown';
  status: 'pending' | 'parsed' | 'error';
  content?: string;
}

interface FileUploaderProps {
  onFilesReady: (files: UploadedFile[]) => void;
}

const FILE_TYPE_LABELS: Record<string, string> = {
  classement: 'Classement',
  historique: 'Historique des temps',
  arrets: 'Arrêts aux stands',
  tours: 'Tableau des tours',
  unknown: 'Fichier inconnu',
};

function detectFileType(filename: string): UploadedFile['type'] {
  const lower = filename.toLowerCase();
  if (lower.includes('classement')) return 'classement';
  if (lower.includes('historique')) return 'historique';
  if (lower.includes('arr') || lower.includes('stand')) return 'arrets';
  if (lower.includes('tour') || lower.includes('lap')) return 'tours';
  return 'unknown';
}

export function FileUploader({ onFilesReady }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf'
    );
    
    const newFiles: UploadedFile[] = droppedFiles.map(file => ({
      file,
      type: detectFileType(file.name),
      status: 'pending',
    }));
    
    const allFiles = [...files, ...newFiles];
    setFiles(allFiles);
    if (newFiles.length > 0) {
      onFilesReady(allFiles);
    }
  }, [files, onFilesReady]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files).filter(
      f => f.type === 'application/pdf'
    );
    
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      type: detectFileType(file.name),
      status: 'pending',
    }));
    
    const allFiles = [...files, ...newFiles];
    setFiles(allFiles);
    if (newFiles.length > 0) {
      onFilesReady(allFiles);
    }
  }, [files, onFilesReady]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-border/50 hover:border-border"
        )}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Glissez vos fichiers PDF ici</p>
        <p className="text-sm text-muted-foreground mb-4">
          Classement, historique des temps, arrêts aux stands, tableau des tours
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
          <FileText className="w-4 h-4" />
          Parcourir
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Fichiers sélectionnés ({files.length})
          </h3>
          
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
            >
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {FILE_TYPE_LABELS[file.type]}
                </p>
              </div>
              {file.status === 'parsed' && (
                <Check className="w-4 h-4 text-green-400" />
              )}
              <button
                onClick={() => removeFile(index)}
                className="p-1 rounded hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
          
        </div>
      )}
    </div>
  );
}
