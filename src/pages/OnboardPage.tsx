import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { OnboardDisplay } from '@/components/onboard/OnboardDisplay';
import { KartSelector } from '@/components/onboard/KartSelector';
import { useApexLiveData } from '@/hooks/useApexLiveData';
import { useTeamDetails } from '@/hooks/useTeamDetails';
import { useOnboardMessages } from '@/hooks/useOnboardMessages';
import { MOCK_CONFIG } from '@/data/mockRaceData';

export default function OnboardPage() {
  const { kartNumber } = useParams();
  const [searchParams] = useSearchParams();
  const circuitId = searchParams.get('circuit') || 'rkc';
  const sessionId = searchParams.get('session') || undefined;

  // En mode mock, utiliser automatiquement notre kart
  const defaultKart = MOCK_CONFIG.enabled ? MOCK_CONFIG.ourKart : (kartNumber || '');
  const [selectedKart, setSelectedKart] = useState<string>(defaultKart);

  const { data: liveData, loading } = useApexLiveData(circuitId, 2000); // Refresh rapide

  // Trouver mon kart et les adversaires
  const myDriver = liveData?.drivers?.find((d) => d.kart === selectedKart);
  const myIndex = liveData?.drivers?.findIndex((d) => d.kart === selectedKart) ?? -1;
  const driverAhead = myIndex > 0 ? liveData?.drivers?.[myIndex - 1] : null;
  const driverBehind =
    myIndex >= 0 && myIndex < (liveData?.drivers?.length ?? 0) - 1
      ? liveData?.drivers?.[myIndex + 1]
      : null;

  // Détails de mon équipe
  const { details: myDetails } = useTeamDetails(
    circuitId,
    myDriver?.driverId || null,
    3000
  );

  // Messages du PC
  const { latestMessage } = useOnboardMessages(selectedKart, sessionId);

  // Forcer le mode paysage et empêcher la mise en veille
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // @ts-expect-error - L'API ScreenOrientation lock n'est pas toujours disponible
        await screen.orientation?.lock?.('landscape');
      } catch (e) {
        console.log('Orientation lock not supported');
      }
    };
    lockOrientation();

    // Empêcher la mise en veille
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock?.request?.('screen');
      } catch (e) {
        console.log('Wake lock not supported');
      }
    };
    requestWakeLock();

    // Cacher la barre de navigation sur mobile
    document.body.style.overflow = 'hidden';

    return () => {
      wakeLock?.release?.();
      document.body.style.overflow = '';
    };
  }, []);

  // Si pas de kart sélectionné, afficher le sélecteur
  if (!selectedKart) {
    return (
      <KartSelector
        drivers={liveData?.drivers || []}
        onSelect={setSelectedKart}
        circuitId={circuitId}
        loading={loading}
      />
    );
  }

  // Detecter l'orientation pour forcer le paysage en CSS si nécessaire
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Si la largeur est inférieure à la hauteur, on est en portrait
      setIsPortrait(window.innerWidth < window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const content = (
    <OnboardDisplay
      myDriver={myDriver}
      myDetails={myDetails}
      driverAhead={driverAhead}
      driverBehind={driverBehind}
      latestMessage={latestMessage}
      raceTimeRemaining={liveData?.raceTimeRemaining || 0}
      onChangeKart={() => setSelectedKart('')}
    />
  );

  // Si on est en portrait, on force la rotation CSS
  if (isPortrait) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '100vw', // On déplace l'origine au coin haut-droit
          width: '100vh', // La largeur devient la hauteur de l'écran
          height: '100vw', // La hauteur devient la largeur de l'écran
          transform: 'rotate(90deg)',
          transformOrigin: 'top left',
          backgroundColor: '#000',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
