/**
 * Formatea un valor numérico como moneda colombiana (COP).
 * Ejemplo: fmtCOP(12000) → "$ 12.000"
 */
export const fmtCOP = (n: number | string | undefined | null): string => {
  const num = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (isNaN(num)) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);
};
