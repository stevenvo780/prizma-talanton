/**
 * TutorialContext.tsx
 *
 * Contexto global para el sistema de tutoriales.
 * Expone:
 *  - startTour(route?) — lanza el tour de la ruta actual (o la indicada)
 *  - skipAll()         — marca todos los tours como vistos
 *  - resetAll()        — borra el historial para volver a ver todos
 *  - seenRoutes        — set de rutas ya visitadas
 *
 * Comportamiento reactivo:
 *  - Si un paso tiene `advanceOn`, el popover avanza automáticamente
 *    cuando el usuario hace clic en ese selector (sin necesidad de "Siguiente").
 *  - Si no tiene `advanceOn`, el paso es informativo y solo avanza con el botón.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { TOUR_BY_ROUTE, TourStep } from '../utils/tours';

/* ── Tipos ─────────────────────────────────────────────── */
interface TutorialContextValue {
  startTour: (route?: string) => void;
  stopTour: () => void;
  skipAll: () => void;
  resetAll: () => void;
  seenRoutes: Set<string>;
  currentRoute: string;
  isTourActive: boolean;
}

/* ── Storage helpers ───────────────────────────────────── */
const STORAGE_KEY = 'talanton_seen_tours';

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

function saveSeen(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}

/* ── Context ───────────────────────────────────────────── */
export const TutorialContext = createContext<TutorialContextValue>({
  startTour: () => undefined,
  stopTour: () => undefined,
  skipAll: () => undefined,
  resetAll: () => undefined,
  seenRoutes: new Set(),
  currentRoute: '/',
  isTourActive: false,
});

export const useTutorial = () => useContext(TutorialContext);

/* ── Provider ──────────────────────────────────────────── */
export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [seenRoutes, setSeenRoutes] = useState<Set<string>>(loadSeen);
  const [isTourActive, setIsTourActive] = useState(false);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  // Guarda los listeners activos para poder limpiarlos
  const advanceListenersRef = useRef<Array<{ el: Element; fn: EventListener }>>([]);
  // Pasos del tour activo (para saber el advanceOn de cada índice)
  const activeStepsRef = useRef<TourStep[]>([]);

  /* Limpia todos los listeners de "advanceOn" activos */
  const clearAdvanceListeners = useCallback(() => {
    advanceListenersRef.current.forEach(({ el, fn }) => {
      el.removeEventListener('click', fn);
    });
    advanceListenersRef.current = [];
  }, []);

  /* Registra el listener para el paso actual */
  const attachAdvanceListener = useCallback((stepIndex: number) => {
    clearAdvanceListeners();
    const step = activeStepsRef.current[stepIndex];
    if (!step?.advanceOn) return;

    // Delay mínimo para que driver.js termine de renderizar el popover
    setTimeout(() => {
      const targets = Array.from(document.querySelectorAll(step.advanceOn!));
      if (!targets.length) return;

      const handler: EventListener = (e) => {
        // No consumimos el evento — dejamos que el clic llegue al elemento
        // y avanzamos el tour justo después
        setTimeout(() => {
          if (driverRef.current && driverRef.current.isActive()) {
            driverRef.current.moveNext();
          }
        }, 80);
      };

      targets.forEach((el) => {
        el.addEventListener('click', handler);
        advanceListenersRef.current.push({ el, fn: handler });
      });
    }, 150);
  }, [clearAdvanceListeners]);

  /* Marca la ruta como vista y persiste */
  const markSeen = useCallback((route: string) => {
    setSeenRoutes((prev) => {
      const next = new Set(prev);
      next.add(route);
      saveSeen(next);
      return next;
    });
  }, []);

  /* Destruye el tour activo y limpia listeners */
  const destroyTour = useCallback(() => {
    clearAdvanceListeners();
    if (driverRef.current) {
      try {
        driverRef.current.destroy();
      } catch {
        // ignore
      }
      driverRef.current = null;
    }
    activeStepsRef.current = [];
  }, [clearAdvanceListeners]);

  /* Construye y lanza el tour */
  const startTour = useCallback(
    (route?: string) => {
      const targetRoute = route ?? location.pathname;
      const steps: TourStep[] = TOUR_BY_ROUTE[targetRoute] ?? [];
      if (!steps.length) return;

      destroyTour();
      activeStepsRef.current = steps;

      const driverInstance = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayOpacity: 0.5,
        stagePadding: 8,
        stageRadius: 8,
        progressText: 'Paso {{current}} de {{total}}',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido! ✓',
        onDestroyStarted: () => {
          clearAdvanceListeners();
          setIsTourActive(false);
          // Marcamos la ruta como vista en cuanto el tour comienza a cerrarse
          // (sea por "¡Entendido!", botón X, o Escape)
          markSeen(targetRoute);
          // IMPORTANTE: en driver.js v1, si defines onDestroyStarted
          // DEBES llamar destroy() manualmente para que el tour se cierre.
          driverInstance.destroy();
        },
        onDestroyed: () => {
          clearAdvanceListeners();
          setIsTourActive(false);
        },
        onHighlightStarted: (_el: Element | undefined, step: any, opts: any) => {
          // Registra el advanceOn del paso que acaba de entrar
          const idx = opts?.state?.activeIndex ?? 0;
          attachAdvanceListener(idx);
        },
        steps: steps.map((s) => ({
          element: s.element,
          popover: {
            title: s.popover.title,
            description: s.popover.description,
            side: s.popover.side,
            align: s.popover.align,
          },
        })),
      });

      driverRef.current = driverInstance;
      setIsTourActive(true);
      driverInstance.drive();

      // Registrar listener para el primer paso al arrancar
      attachAdvanceListener(0);
    },
    [location.pathname, markSeen, destroyTour, attachAdvanceListener, clearAdvanceListeners],
  );

  /* Auto-lanzar al entrar a una ruta nueva (solo si no se ha visto) */
  useEffect(() => {
    const route = location.pathname;
    // Leer directamente de localStorage para evitar race conditions con el estado React
    const freshSeen = loadSeen();
    if (freshSeen.has(route)) return;
    if (!TOUR_BY_ROUTE[route]?.length) return;

    const timer = setTimeout(() => {
      startTour(route);
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* Limpiar al desmontar */
  useEffect(() => {
    return () => {
      destroyTour();
    };
  }, [destroyTour]);

  const skipAll = useCallback(() => {
    const allKeys = Object.keys(TOUR_BY_ROUTE);
    const allRoutes = new Set(allKeys);
    setSeenRoutes(allRoutes);
    saveSeen(allRoutes);
    destroyTour();
  }, [destroyTour]);

  const resetAll = useCallback(() => {
    setSeenRoutes(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        startTour,
        stopTour: destroyTour,
        skipAll,
        resetAll,
        seenRoutes,
        currentRoute: location.pathname,
        isTourActive,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

