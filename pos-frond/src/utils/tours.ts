/**
 * tours.ts — Definición de todos los pasos de tutorial por ruta.
 * Usa driver.js v1 (DriveStep[]).
 *
 * Convención de IDs:
 *  - Los elementos del DOM deben tener el atributo data-tour="<id>" O id="<id>"
 *  - Aquí referenciamos con # (CSS selector) apuntando al atributo id="" o al data-tour
 *
 * advanceOn: selector CSS del elemento cuyo clic avanza al siguiente paso.
 *   - Si es el mismo que `element`, pon el mismo valor.
 *   - Si no se define, el paso es informativo y solo avanza con "Siguiente".
 */

export interface TourStep {
  element?: string; // selector CSS (ej. "#my-id" o "[data-tour='foo']")
  advanceOn?: string; // selector del elemento que al ser clicado avanza al siguiente paso
  popover: {
    title: string;
    description: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
}

// ─── POS View ───────────────────────────────────────────────────────────────
export const tourPOS: TourStep[] = [
  {
    popover: {
      title: '🛒 Punto de Venta',
      description:
        'Bienvenido al POS. Aquí gestionas ventas paso a paso: seleccionas cliente, agregas productos, configuras el pago y emites la factura. <br/><small style="color:#aaa">▶ El tutorial avanzará mientras usas la app</small>',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="pos-stepper"]',
    popover: {
      title: '📋 Pasos de la venta',
      description:
        'El proceso tiene 3 pasos: <strong>1) Cliente</strong>, <strong>2) Productos</strong> y <strong>3) Pago</strong>. Puedes avanzar o retroceder libremente. <br/><small style="color:#aaa">▶ Haz clic en el paso 1 para continuar</small>',
      side: 'bottom',
      align: 'center',
    },
    advanceOn: '[data-tour="pos-stepper"]',
  },
  {
    element: '[data-tour="pos-client-step"]',
    popover: {
      title: '👤 Paso 1 — Cliente',
      description:
        'Busca o selecciona el cliente para esta venta. Puedes continuar sin cliente (venta anónima). <br/><small style="color:#aaa">▶ Busca un cliente o haz clic en "Siguiente"</small>',
      side: 'bottom',
      align: 'start',
    },
    advanceOn: '[data-tour="pos-client-step"] button',
  },
  {
    element: '[data-tour="pos-product-selection"]',
    popover: {
      title: '📦 Paso 2 — Productos',
      description:
        'Filtra por categoría o busca por nombre. <strong>Haz clic en un producto</strong> para agregarlo al carrito. <br/><small style="color:#aaa">▶ Toca cualquier producto para avanzar</small>',
      side: 'bottom',
      align: 'start',
    },
    advanceOn: '[data-tour="pos-product-selection"]',
  },
  {
    element: '[data-tour="pos-cart-summary"]',
    popover: {
      title: '🧾 Resumen del carrito',
      description:
        'Aquí ves los productos seleccionados, subtotales, descuentos e impuestos. Puedes eliminar ítems antes de pagar.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="pos-payment-step"]',
    popover: {
      title: '💳 Paso 3 — Pago',
      description:
        'Elige el método de pago (Efectivo, Tarjeta, Transferencia...), el estado (Pagado / Pendiente) y si generas factura DIAN o solo recibo.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="pos-cashbox-btn"]',
    popover: {
      title: '🏧 Gestión de Caja',
      description:
        'Desde aquí haces entradas y salidas de efectivo en la caja seleccionada. Ideal para registrar gastos o cuadrar al cierre.',
      side: 'bottom',
      align: 'end',
    },
  },
];

// ─── Products View ───────────────────────────────────────────────────────────
export const tourProducts: TourStep[] = [
  {
    popover: {
      title: '📦 Gestión de Productos',
      description:
        'Aquí administras tu catálogo: productos, categorías y listas de precios. Usa las pestañas para navegar entre secciones.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="products-tab-products"]',
    advanceOn: '[data-tour="products-tab-products"]',
    popover: {
      title: '🛍️ Pestaña Productos',
      description:
        'Crea, edita y desactiva productos. Cada producto puede tener múltiples SKUs con precios distintos según la lista de precios. <br/><small style="color:#aaa">▶ Haz clic en esta pestaña para continuar</small>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="products-tab-categories"]',
    advanceOn: '[data-tour="products-tab-categories"]',
    popover: {
      title: '🏷️ Pestaña Categorías',
      description:
        'Organiza los productos en categorías para facilitar la búsqueda en el POS. <br/><small style="color:#aaa">▶ Haz clic en "Categorías" para continuar</small>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="products-tab-pricing"]',
    advanceOn: '[data-tour="products-tab-pricing"]',
    popover: {
      title: '💰 Pestaña Categorías de Precios',
      description:
        'Define listas de precios (mayorista, minorista, empleados…). <br/><small style="color:#aaa">▶ Haz clic en "Categorías de Precios" para continuar</small>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="products-add-btn"]',
    advanceOn: '[data-tour="products-add-btn"]',
    popover: {
      title: '➕ Crear producto',
      description:
        'Haz clic aquí para agregar un nuevo producto al catálogo. Podrás subir imagen, añadir SKUs y asignar precios. <br/><small style="color:#aaa">▶ Haz clic en el botón para continuar</small>',
      side: 'bottom',
      align: 'end',
    },
  },
];

// ─── Clients View ────────────────────────────────────────────────────────────
export const tourClients: TourStep[] = [
  {
    popover: {
      title: '👥 Gestión de Clientes',
      description:
        'Administra tu base de clientes. Puedes crear, editar y buscar clientes por nombre, correo o documento.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="clients-search"]',
    advanceOn: '[data-tour="clients-search"] input',
    popover: {
      title: '🔍 Búsqueda',
      description: 'Escribe el nombre, correo o número de documento del cliente para encontrarlo rápidamente. <br/><small style="color:#aaa">▶ Haz clic en el buscador para continuar</small>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="clients-add-btn"]',
    advanceOn: '[data-tour="clients-add-btn"]',
    popover: {
      title: '➕ Nuevo cliente',
      description: 'Crea un cliente nuevo. Los datos mínimos son nombre y apellido; el correo es opcional pero útil para enviarle la factura. <br/><small style="color:#aaa">▶ Haz clic en "Crear nuevo cliente" para continuar</small>',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="clients-table"]',
    popover: {
      title: '📋 Lista de clientes',
      description: 'Aquí aparecen todos tus clientes. Haz clic en el icono de edición para modificar sus datos.',
      side: 'top',
      align: 'start',
    },
  },
];

// ─── Invoice View ─────────────────────────────────────────────────────────────
export const tourInvoice: TourStep[] = [
  {
    popover: {
      title: '🧾 Historial de Facturas',
      description:
        'Aquí consultas todas las ventas realizadas. Puedes filtrar por fechas, estado de pago y tipo, y exportar a Excel.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="invoice-filters"]',
    advanceOn: '[data-tour="invoice-filters"]',
    popover: {
      title: '🔎 Filtros',
      description:
        'Filtra facturas por rango de fechas, método de pago y estado (Pagado / Pendiente). <br/><small style="color:#aaa">▶ Haz clic en "Filtros" para continuar</small>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="invoice-export-btn"]',
    popover: {
      title: '📊 Exportar',
      description: 'Descarga las facturas filtradas en formato Excel para análisis contable o conciliación bancaria.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="invoice-table"]',
    popover: {
      title: '📋 Lista de facturas',
      description:
        'Cada fila es una factura. Haz clic en ella para ver el detalle completo. También puedes emitir la factura DIAN desde aquí si aún no se ha enviado.',
      side: 'top',
      align: 'start',
    },
  },
];

// ─── Settings View ────────────────────────────────────────────────────────────
export const tourSettings: TourStep[] = [
  {
    popover: {
      title: '⚙️ Configuración',
      description:
        'Desde aquí configuras todos los parámetros del sistema: facturación DIAN, impuestos, descuentos, cajas y más.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="settings-tab-dian"]',
    advanceOn: '[data-tour="settings-tab-dian"]',
    popover: {
      title: '🏛️ DIAN / Facturación Electrónica',
      description:
        'Conecta tu proveedor de facturación (Alegra u otro) con tus credenciales. <br/><small style="color:#aaa">▶ Haz clic en esta sección para continuar</small>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-tab-taxes"]',
    advanceOn: '[data-tour="settings-tab-taxes"]',
    popover: {
      title: '🧮 Impuestos',
      description: 'Define los impuestos que aplicas (IVA 19%, INC, etc.). <br/><small style="color:#aaa">▶ Haz clic en "Impuestos" para continuar</small>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-tab-discounts"]',
    advanceOn: '[data-tour="settings-tab-discounts"]',
    popover: {
      title: '🎁 Beneficios / Descuentos',
      description: 'Crea descuentos fijos o porcentuales. Puedes aplicarlos por SKU o de forma global en el POS. <br/><small style="color:#aaa">▶ Haz clic en "Beneficios" para continuar</small>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-tab-cashbox"]',
    advanceOn: '[data-tour="settings-tab-cashbox"]',
    popover: {
      title: '💰 Cajas',
      description: 'Gestiona tus cajas registradoras. Cada caja tiene su propio saldo y registro de movimientos. <br/><small style="color:#aaa">▶ Haz clic en "Cajas" para continuar</small>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-tab-webhooks"]',
    advanceOn: '[data-tour="settings-tab-webhooks"]',
    popover: {
      title: '🔗 Webhooks',
      description:
        'Configura URLs para recibir notificaciones automáticas cuando se cree o actualice una factura. <br/><small style="color:#aaa">▶ Haz clic en "Webhooks" para continuar</small>',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="settings-tab-plugins"]',
    advanceOn: '[data-tour="settings-tab-plugins"]',
    popover: {
      title: '🧩 Plugins',
      description:
        'Activa integraciones con terceros como Talaria, Hermes o Pistis. Requiere token de autenticación del proveedor.',
      side: 'right',
      align: 'start',
    },
  },
];

// ─── Profile View ─────────────────────────────────────────────────────────────
export const tourProfile: TourStep[] = [
  {
    popover: {
      title: '🏢 Perfil de la empresa',
      description:
        'Aquí completas los datos de tu empresa: razón social, NIT, dirección y régimen tributario. Esta información aparece en las facturas.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="profile-form"]',
    advanceOn: '[data-tour="profile-form"] input',
    popover: {
      title: '📝 Datos de la empresa',
      description:
        'Completa todos los campos requeridos. El NIT y la razón social son obligatorios para la facturación DIAN. <br/><small style="color:#aaa">▶ Haz clic en cualquier campo para continuar</small>',
      side: 'right',
      align: 'start',
    },
  },
];

// ─── Subscribe View ───────────────────────────────────────────────────────────
export const tourSubscribe: TourStep[] = [
  {
    popover: {
      title: '⭐ Planes y Suscripción',
      description:
        'Elige el plan que mejor se adapte a tu negocio. Todos incluyen POS completo, API REST y webhooks para integraciones.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="subscribe-plans"]',
    popover: {
      title: '📦 Comparativa de planes',
      description:
        'Compara las características de cada plan. El plan Pro incluye soporte prioritario y mayor límite de transacciones mensuales.',
      side: 'bottom',
      align: 'center',
    },
  },
];

// ─── Header / Navegación ──────────────────────────────────────────────────────
export const tourHeader: TourStep[] = [
  {
    element: '[data-tour="header-cashbox-select"]',
    popover: {
      title: '🏧 Selector de caja',
      description:
        'Cambia la caja activa desde aquí. Todas las ventas del POS se registrarán en la caja seleccionada.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="header-sidebar-btn"]',
    advanceOn: '[data-tour="header-sidebar-btn"]',
    popover: {
      title: '☰ Menú principal',
      description: 'Navega entre las secciones de la aplicación: POS, Productos, Clientes, Facturas y Configuración. <br/><small style="color:#aaa">▶ Haz clic en el menú para continuar</small>',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="header-profile-btn"]',
    popover: {
      title: '👤 Perfil y sesión',
      description: 'Accede a tu perfil de empresa o cierra sesión desde este menú.',
      side: 'bottom',
      align: 'end',
    },
  },
];

// ─── Mapa ruta → pasos ────────────────────────────────────────────────────────
export const TOUR_BY_ROUTE: Record<string, TourStep[]> = {
  '/pos':          tourPOS,
  '/products':     tourProducts,
  '/clients':      tourClients,
  '/invoice':      tourInvoice,
  '/invoices':     tourInvoice,
  '/settings':     tourSettings,
  '/profile/edit': tourProfile,
  '/subscribe':    tourSubscribe,
};

export const ROUTE_LABELS: Record<string, string> = {
  '/pos':          'Punto de Venta',
  '/products':     'Productos',
  '/clients':      'Clientes',
  '/invoice':      'Facturas',
  '/invoices':     'Facturas',
  '/settings':     'Configuración',
  '/profile/edit': 'Perfil',
  '/subscribe':    'Suscripción',
};

