/**
 * POSTour.tsx
 *
 * Tutorial guiado de primer uso del Punto de Venta usando PrizmaTour
 * de prizma-ui@1.1.0.
 *
 * - Arranca automáticamente la primera vez (autoStart + runKey persiste en
 *   localStorage como "prizma-tour:pos-frond-v1").
 * - Expone onRequestStart para que el botón manual del POS lo relance.
 */
import React from 'react';
import { PrizmaTour, usePrizmaTour, type TourStep } from 'prizma-ui';

export const POS_TOUR_RUN_KEY = 'pos-frond-v1';

const POS_TOUR_STEPS: TourStep[] = [
  {
    // Sin target → tarjeta centrada de bienvenida
    title: 'Bienvenido al Punto de Venta',
    body: 'Este tutorial te guiará por el flujo completo de una venta: cliente, productos, carrito y cobro. Puedes repetirlo en cualquier momento con el botón "?".',
    placement: 'center',
  },
  {
    target: '[data-tour="pos-stepper"]',
    title: 'Pasos de la venta',
    body: 'El proceso tiene 3 etapas: Cliente → Productos → Pago. Haz clic en cualquier etapa para saltar directamente a ella.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="pos-client-step"]',
    title: 'Paso 1 — Selecciona el cliente',
    body: 'Busca un cliente existente o créalo aquí. También puedes continuar sin cliente para ventas anónimas en mostrador.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="pos-product-search"]',
    title: 'Paso 2 — Busca productos',
    body: 'Filtra por categoría o escribe el nombre del producto. Haz clic en cualquier tarjeta para agregarlo al carrito.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="pos-cart-totals"]',
    title: 'Revisa el carrito y el total',
    body: 'Aquí ves subtotal, descuentos e impuestos aplicados. Ajusta cantidades, elimina ítems o vacía el carrito antes de continuar.',
    placement: 'left',
  },
  {
    target: '[data-tour="pos-payment-step"]',
    title: 'Paso 3 — Elige el medio de pago y cobra',
    body: 'Selecciona Efectivo, Tarjeta, Transferencia u otro método. Marca si la venta es Pagada o Pendiente y elige si emites Factura Electrónica DIAN o Recibo POS.',
    placement: 'top',
  },
  {
    target: '[data-tour="pos-cashbox-btn"]',
    title: 'Gestión de Caja',
    body: 'Desde el Header puedes abrir la caja activa para registrar entradas y salidas de efectivo antes de cerrar turno.',
    placement: 'bottom',
  },
];

interface POSTourProps {
  /** Ref de función para que el padre llame a start() desde fuera */
  onMount?: (start: () => void) => void;
}

const POSTour: React.FC<POSTourProps> = ({ onMount }) => {
  const tour = usePrizmaTour({
    runKey: POS_TOUR_RUN_KEY,
    total: POS_TOUR_STEPS.length,
  });

  // Expone la función start al padre a través de onMount
  React.useEffect(() => {
    if (onMount) onMount(tour.start);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PrizmaTour
      steps={POS_TOUR_STEPS}
      runKey={POS_TOUR_RUN_KEY}
      autoStart
      {...tour.tourProps}
      onFinish={() => tour.finish()}
      onSkip={() => tour.finish()}
    />
  );
};

export default POSTour;
