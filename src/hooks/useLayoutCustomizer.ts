import { useState, useEffect } from 'react';

export type SectionId = 
  | 'ai-advisor'
  | 'sector-analysis'
  | 'best-times'
  | 'sector-comparison'
  | 'gap-chart'
  | 'pit-window'
  | 'standings';

export interface SectionConfig {
  id: SectionId;
  label: string;
  visible: boolean;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'ai-advisor', label: 'Conseils IA', visible: true },
  { id: 'sector-analysis', label: 'Analyse Secteurs', visible: true },
  { id: 'best-times', label: 'Meilleurs Temps', visible: true },
  { id: 'sector-comparison', label: 'Comparaison Secteurs', visible: true },
  { id: 'gap-chart', label: 'Graphique Écarts', visible: true },
  { id: 'pit-window', label: 'Fenêtre Pit', visible: true },
  { id: 'standings', label: 'Classement', visible: true },
];

const STORAGE_KEY = 'live-dashboard-layout';

export function useLayoutCustomizer() {
  const [sections, setSections] = useState<SectionConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new sections
        const savedIds = new Set(parsed.map((s: SectionConfig) => s.id));
        const merged = [
          ...parsed,
          ...DEFAULT_SECTIONS.filter(s => !savedIds.has(s.id))
        ];
        return merged;
      }
    } catch (e) {
      console.error('Failed to load layout:', e);
    }
    return DEFAULT_SECTIONS;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  const moveSection = (fromIndex: number, toIndex: number) => {
    const updated = [...sections];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    setSections(updated);
  };

  const toggleVisibility = (id: SectionId) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, visible: !s.visible } : s
    ));
  };

  const resetLayout = () => {
    setSections(DEFAULT_SECTIONS);
  };

  const getSectionOrder = (): SectionId[] => {
    return sections.filter(s => s.visible).map(s => s.id);
  };

  return {
    sections,
    isCustomizing,
    setIsCustomizing,
    moveSection,
    toggleVisibility,
    resetLayout,
    getSectionOrder,
  };
}
