import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUploader } from '@/components/import/FileUploader';
import { TeamSelector } from '@/components/import/TeamSelector';
import { DriverManager, Driver } from '@/components/import/DriverManager';
import { StintDragDrop, StintData } from '@/components/import/StintDragDrop';
import { TeamData, ImportedLapData } from '@/types/race';
import { extractPdfText, parseRanking, parsePitStopsWithStints, parseLapHistory, parseTimeToMs } from '@/utils/pdfParser';
import { supabase } from '@/integrations/supabase/client';
import { Upload, ChevronRight, Check, ArrowLeft, Save, AlertCircle, FileText, Weight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 'config' | 'team' | 'drivers' | 'assign' | 'complete';

interface UploadedFile {
  file: File;
  type: 'classement' | 'historique' | 'arrets' | 'tours' | 'unknown';
  status: 'pending' | 'parsed' | 'error';
  content?: string;
}

interface ParsedPitStop {
  lap: number;
  duration?: number;
  trackTimeMs?: number;
  lapsCount?: number;
  bestLapMs?: number;
  avgLapMs?: number;
}

interface ParsedRaceData {
  teams: TeamData[];
  lapsData: Map<number, ImportedLapData[]>;
  pitStops: Map<number, ParsedPitStop[]>;
}

export default function RaceImport() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('config');
  const [raceName, setRaceName] = useState('');
  const [ballastTarget, setBallastTarget] = useState(80);
  const [parsedData, setParsedData] = useState<ParsedRaceData | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stints, setStints] = useState<StintData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const isRaceNameValid = raceName.trim().length >= 3;

  const handleFilesReady = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
  }, []);

  const analyzeFiles = async () => {
    if (!isRaceNameValid) {
      toast.error("Veuillez entrer un nom de course (min. 3 caractères)");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("Veuillez ajouter des fichiers PDF");
      return;
    }

    setIsAnalyzing(true);
    toast.info("Analyse des fichiers en cours...");

    try {
      let allTeams: TeamData[] = [];
      const lapsData = new Map<number, ImportedLapData[]>();
      const pitStopsData = new Map<number, { lap: number; duration?: number; trackTimeMs?: number; lapsCount?: number; bestLapMs?: number; avgLapMs?: number }[]>();

      // Process each PDF file
      for (const uploadedFile of uploadedFiles) {
        try {
          console.log(`Processing ${uploadedFile.file.name} (type: ${uploadedFile.type})`);
          const text = await extractPdfText(uploadedFile.file);
          console.log(`Extracted ${text.length} characters from ${uploadedFile.file.name}`);
          console.log('Sample text:', text.substring(0, 500));

          if (uploadedFile.type === 'classement') {
            const { teams } = parseRanking(text);
            console.log(`Found ${teams.length} teams in classement`);
            if (teams.length > 0) {
              allTeams = teams;
            }
          } else if (uploadedFile.type === 'arrets') {
            const stintsMap = parsePitStopsWithStints(text);
            console.log(`Found stints for ${stintsMap.size} teams in arrets`);
            stintsMap.forEach((stints, kart) => {
              pitStopsData.set(kart, stints.map(s => ({
                lap: s.endLap,
                duration: undefined,
                trackTimeMs: s.trackTimeMs,
                lapsCount: s.lapsCount,
                bestLapMs: s.bestLapMs,
                avgLapMs: s.avgLapMs,
              })));
            });
          } else if (uploadedFile.type === 'historique') {
            const lapsMap = parseLapHistory(text);
            console.log(`Found laps for ${lapsMap.size} teams in historique`);
            lapsMap.forEach((laps, kart) => {
              lapsData.set(kart, laps);
            });
          }
        } catch (fileError) {
          console.error(`Error processing ${uploadedFile.file.name}:`, fileError);
        }
      }

      // If no teams from ranking, try to create from pit stops or laps data
      if (allTeams.length === 0) {
        console.log('No teams from ranking, trying to create from other data...');
        
        // Try pit stops data first
        if (pitStopsData.size > 0) {
          let pos = 1;
          pitStopsData.forEach((stints, kart) => {
            const totalLaps = stints.length > 0 ? stints[stints.length - 1].lap : 0;
            allTeams.push({
              position: pos++,
              kartNumber: kart,
              teamName: `Équipe #${kart}`,
              totalLaps,
              bestLap: stints.reduce((best, s) => s.bestLapMs && s.bestLapMs < best ? s.bestLapMs : best, Infinity) || 0,
              laps: [],
              stints: [],
              pitStops: [],
            });
          });
          console.log(`Created ${allTeams.length} teams from pit stops data`);
        }
        
        // Try laps data if still no teams
        if (allTeams.length === 0 && lapsData.size > 0) {
          let pos = 1;
          lapsData.forEach((laps, kart) => {
            const validLaps = laps.filter(l => l.total > 0 && l.total < 120000);
            allTeams.push({
              position: pos++,
              kartNumber: kart,
              teamName: `Équipe #${kart}`,
              totalLaps: laps.length,
              bestLap: validLaps.length > 0 ? Math.min(...validLaps.map(l => l.total)) : 0,
              laps: [],
              stints: [],
              pitStops: [],
            });
          });
          console.log(`Created ${allTeams.length} teams from laps data`);
        }
      }

      if (allTeams.length === 0) {
        toast.error("Impossible d'extraire les équipes. Ouvrez la console (F12) pour voir les détails.");
        setIsAnalyzing(false);
        return;
      }

      // Merge lap and pit stop data into teams
      allTeams.forEach(team => {
        team.laps = lapsData.get(team.kartNumber) || [];
        team.pitStops = pitStopsData.get(team.kartNumber)?.map(p => p.lap) || [];
      });

      setParsedData({
        teams: allTeams,
        lapsData,
        pitStops: pitStopsData,
      });

      toast.success(`${allTeams.length} équipes détectées!`);
      setStep('team');
    } catch (error) {
      console.error('Error analyzing files:', error);
      toast.error("Erreur lors de l'analyse des fichiers");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTeamSelect = useCallback((team: TeamData) => {
    setSelectedTeam(team);

    // Get lap data and pit stops for this team
    const teamLaps = parsedData?.lapsData.get(team.kartNumber) || [];
    const teamStintsData = parsedData?.pitStops.get(team.kartNumber) || [];

    console.log(`Team ${team.kartNumber} - ${team.teamName}: ${teamStintsData.length} stints from PDF`);
    console.log(`  Lap history: ${teamLaps.length} laps`);

    // Function to calculate REAL stats from lap history (not from PDF stint data)
    // This fixes the bug where lap 1 (standing start) was counted as "best lap"
    const calculateRealStats = (startLap: number, endLap: number): { best: number; avg: number } => {
      // Filter valid laps for this stint:
      // - Must be within stint range
      // - Exclude times > 90s (pit stops or anomalies)
      // - Exclude times < 60s (impossible for this circuit)
      const validLaps = teamLaps.filter(l => 
        l.lap >= startLap && 
        l.lap <= endLap && 
        l.total > 60000 && // > 60s minimum realistic
        l.total < 90000 // < 90s (not a pit)
      );

      if (validLaps.length === 0) {
        // Fallback: include all laps with wider filter
        const fallback = teamLaps.filter(l => 
          l.lap >= startLap && 
          l.lap <= endLap && 
          l.total > 50000 && 
          l.total < 180000
        );
        const times = fallback.map(l => l.total);
        return {
          best: times.length > 0 ? Math.min(...times) : 0,
          avg: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
        };
      }

      const times = validLaps.map(l => l.total);
      return {
        best: Math.min(...times),
        avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      };
    };

    const generatedStints: StintData[] = [];

    if (teamStintsData.length > 0) {
      // IMPORTANT: Sort stints by endLap to ensure correct order
      const sortedStints = [...teamStintsData].sort((a, b) => a.lap - b.lap);
      
      let currentStart = 1;
      
      // Use sequential numbering (index + 1), NOT the stint number from PDF
      sortedStints.forEach((stintData, index) => {
        const endLap = stintData.lap;
        const lapsCount = endLap - currentStart + 1;
        
        // Skip invalid stints
        if (endLap < currentStart || lapsCount <= 0) {
          console.warn(`  Skipping invalid stint: endLap=${endLap}, currentStart=${currentStart}`);
          return;
        }

        // Calculate REAL stats from lap history
        const realStats = calculateRealStats(currentStart, endLap);
        
        // Use real stats if available, otherwise fall back to PDF data
        const bestLapMs = realStats.best > 0 ? realStats.best : (stintData.bestLapMs || 0);
        const avgLapMs = realStats.avg > 0 ? realStats.avg : (stintData.avgLapMs || 0);

        // Format for logging
        const bestFormatted = bestLapMs > 0 
          ? `${Math.floor(bestLapMs / 60000)}:${((bestLapMs % 60000) / 1000).toFixed(3).padStart(6, '0')}`
          : 'N/A';

        console.log(`  S${index + 1}: T${currentStart}→${endLap} (${lapsCount} tours) best=${bestFormatted}`);
        
        generatedStints.push({
          stintNumber: index + 1,  // SEQUENTIAL numbering
          startLap: currentStart,
          endLap: endLap,
          lapCount: lapsCount,
          bestLapMs,
          avgLapMs,
          trackTimeMs: stintData.trackTimeMs,
          assignedDriverId: null,
        });
        
        currentStart = endLap + 1;
      });
    } else {
      // Fallback: single stint covering all laps
      const totalLaps = team.totalLaps || teamLaps.length || 207;
      const stats = calculateRealStats(1, totalLaps);

      generatedStints.push({
        stintNumber: 1,
        startLap: 1,
        endLap: totalLaps,
        lapCount: totalLaps,
        bestLapMs: stats.best || team.bestLap,
        avgLapMs: stats.avg,
        assignedDriverId: null,
      });
    }

    console.log(`\n=== RÉSULTAT: ${generatedStints.length} stints ===`);
    generatedStints.forEach(s => {
      const bestFormatted = s.bestLapMs > 0 
        ? `${Math.floor(s.bestLapMs / 60000)}:${((s.bestLapMs % 60000) / 1000).toFixed(3).padStart(6, '0')}`
        : 'N/A';
      console.log(`  S${s.stintNumber}: T${s.startLap}→${s.endLap} (${s.lapCount} tours) - Best: ${bestFormatted}`);
    });

    setStints(generatedStints.length > 0 ? generatedStints : [{
      stintNumber: 1,
      startLap: 1,
      endLap: team.totalLaps || teamLaps.length || 207,
      lapCount: team.totalLaps || teamLaps.length || 207,
      bestLapMs: team.bestLap,
      avgLapMs: 0,
      assignedDriverId: null,
    }]);

    // Load default drivers
    setDrivers([
      { id: crypto.randomUUID(), name: 'ALEX', code: 'A', color: '#F59E0B', weight_kg: 67 },
      { id: crypto.randomUUID(), name: 'EVAN', code: 'B', color: '#EF4444', weight_kg: null },
      { id: crypto.randomUUID(), name: 'ENZO', code: 'C', color: '#3B82F6', weight_kg: null },
      { id: crypto.randomUUID(), name: 'IDRISS', code: 'D', color: '#10B981', weight_kg: 95 },
    ]);

    setStep('drivers');
  }, [parsedData]);

  const proceedToAssignment = () => {
    if (drivers.length === 0) {
      toast.error("Ajoutez au moins un pilote");
      return;
    }
    setStep('assign');
  };

  const allStintsAssigned = useMemo(() => 
    stints.every(s => s.assignedDriverId), 
    [stints]
  );

  const saveRace = async () => {
    if (!selectedTeam || !allStintsAssigned) {
      toast.error("Tous les stints doivent être assignés");
      return;
    }

    try {
      // 1. Create or get team
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('name', selectedTeam.teamName)
        .maybeSingle();

      let teamId = existingTeam?.id;

      if (!teamId) {
        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert({ name: selectedTeam.teamName })
          .select('id')
          .single();

        if (teamError) throw teamError;
        teamId = newTeam.id;
      }

      // 2. Save drivers
      const driverIds: Record<string, string> = {};
      for (const driver of drivers) {
        const { data: existingDriver } = await supabase
          .from('drivers')
          .select('id')
          .eq('team_id', teamId)
          .eq('name', driver.name)
          .maybeSingle();

        if (existingDriver) {
          driverIds[driver.id] = existingDriver.id;
          // Update weight if changed
          await supabase
            .from('drivers')
            .update({ weight_kg: driver.weight_kg, color: driver.color })
            .eq('id', existingDriver.id);
        } else {
          const { data: newDriver, error: driverError } = await supabase
            .from('drivers')
            .insert({
              team_id: teamId,
              name: driver.name,
              code: driver.code,
              color: driver.color,
              weight_kg: driver.weight_kg,
            })
            .select('id')
            .single();

          if (driverError) throw driverError;
          driverIds[driver.id] = newDriver.id;
        }
      }

      // 3. Create race
      const laps = parsedData?.lapsData.get(selectedTeam.kartNumber) || [];
      const validLaps = laps.filter(l => l.total > 0 && l.total < 120000);
      const bestLap = validLaps.length > 0 ? Math.min(...validLaps.map(l => l.total)) : selectedTeam.bestLap;
      const bestLapNumber = validLaps.find(l => l.total === bestLap)?.lap || 0;

      const { data: race, error: raceError } = await supabase
        .from('races')
        .insert({
          team_id: teamId,
          name: raceName,
          ballast_target_kg: ballastTarget,
          kart_number: selectedTeam.kartNumber,
          position: selectedTeam.position,
          total_karts: parsedData?.teams.length || 47,
          best_lap_ms: Math.round(bestLap),
          best_lap_number: bestLapNumber,
          total_laps: selectedTeam.totalLaps || laps.length,
        })
        .select('id')
        .single();

      if (raceError) throw raceError;

      // 4. Save laps
      if (laps.length > 0) {
        const lapInserts = laps.map(l => ({
          race_id: race.id,
          lap_number: l.lap,
          lap_time_ms: Math.round(l.total),
        }));

        await supabase.from('race_laps').insert(lapInserts);
      }

      // 5. Save pit stops
      const pitStops = parsedData?.pitStops.get(selectedTeam.kartNumber) || [];
      if (pitStops.length > 0) {
        const pitInserts = pitStops.map(p => ({
          race_id: race.id,
          lap_number: p.lap,
          duration_ms: p.duration || null,
        }));

        await supabase.from('pit_stops').insert(pitInserts);
      }

      // 6. Save stints
      const stintInserts = stints.map(s => ({
        race_id: race.id,
        driver_id: s.assignedDriverId ? driverIds[s.assignedDriverId] : null,
        stint_number: s.stintNumber,
        start_lap: s.startLap,
        end_lap: s.endLap,
        best_lap_ms: s.bestLapMs || null,
        avg_lap_ms: s.avgLapMs || null,
        total_laps: s.lapCount,
      }));

      await supabase.from('stints').insert(stintInserts);

      toast.success('Course enregistrée avec succès!');
      setStep('complete');

      setTimeout(() => navigate('/stints'), 1500);
    } catch (error) {
      console.error('Error saving race:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const stepLabels = ['Configuration', 'Équipe', 'Pilotes', 'Stints', 'Terminé'];
  const stepKeys: Step[] = ['config', 'team', 'drivers', 'assign', 'complete'];
  const currentStepIndex = stepKeys.indexOf(step);

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (step === 'config') navigate('/');
              else if (step === 'team') setStep('config');
              else if (step === 'drivers') setStep('team');
              else if (step === 'assign') setStep('drivers');
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <h1 className="font-racing text-3xl font-bold mb-2">Import de Course</h1>
          <p className="text-muted-foreground">
            Importez et analysez vos résultats de course
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStepIndex === i && "bg-primary text-primary-foreground",
                    currentStepIndex > i && "bg-green-500 text-white",
                    currentStepIndex < i && "bg-secondary text-muted-foreground"
                  )}
                >
                  {currentStepIndex > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card rounded-xl p-6">
          {step === 'config' && (
            <div className="space-y-6">
              {/* Race Name - Required */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Nom de la course <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  placeholder="Ex: Trophée du Père Noël - 4H Endurance"
                  className={cn(
                    "w-full px-4 py-3 rounded-lg bg-secondary/50 border focus:outline-none transition-colors",
                    isRaceNameValid ? "border-border/30 focus:border-primary" : "border-destructive/50"
                  )}
                />
                {!isRaceNameValid && raceName.length > 0 && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Minimum 3 caractères
                  </p>
                )}
              </div>

              {/* Ballast Target */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Weight className="w-4 h-4 text-primary" />
                  Poids minimum de la course (kg)
                </label>
                <input
                  type="number"
                  value={ballastTarget}
                  onChange={(e) => setBallastTarget(parseInt(e.target.value) || 80)}
                  placeholder="80"
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border/30 focus:outline-none focus:border-primary"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Le lest sera calculé automatiquement pour chaque pilote
                </p>
              </div>

              {/* File Upload */}
              <div className="pt-4 border-t border-border/30">
                <FileUploader onFilesReady={handleFilesReady} />
              </div>

              {/* Analyze Button */}
              <button
                onClick={analyzeFiles}
                disabled={!isRaceNameValid || uploadedFiles.length === 0 || isAnalyzing}
                className={cn(
                  "w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                  isRaceNameValid && uploadedFiles.length > 0 && !isAnalyzing
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-red"
                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Analyser les fichiers
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'team' && parsedData && (
            <TeamSelector
              teams={parsedData.teams}
              onTeamSelect={handleTeamSelect}
            />
          )}

          {step === 'drivers' && (
            <div className="space-y-6">
              <DriverManager
                drivers={drivers}
                onDriversChange={setDrivers}
                ballastTarget={ballastTarget}
              />

              <div className="pt-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>{stints.length} stints</strong> détectés (basés sur {stints.length - 1} arrêts aux stands)
                </p>

                <button
                  onClick={proceedToAssignment}
                  disabled={drivers.length === 0}
                  className={cn(
                    "w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                    drivers.length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                  Assigner les stints
                </button>
              </div>
            </div>
          )}

          {step === 'assign' && (
            <div className="space-y-6">
              <StintDragDrop
                stints={stints}
                drivers={drivers}
                onStintsChange={setStints}
              />

              <button
                onClick={saveRace}
                disabled={!allStintsAssigned}
                className={cn(
                  "w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
                  allStintsAssigned
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-red"
                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                )}
              >
                <Save className="w-5 h-5" />
                Enregistrer la course
              </button>

              {!allStintsAssigned && (
                <p className="text-sm text-center text-amber-400">
                  Assignez un pilote à chaque stint pour continuer
                </p>
              )}
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="font-racing text-2xl mb-2">Import réussi!</h2>
              <p className="text-muted-foreground">
                Redirection vers l'analyse des stints...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
