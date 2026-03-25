/**
 * Formatear dinero a formato de moneda argentina
 */
export function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/**
 * Formatear fecha a formato argentino
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Calcular fecha de vencimiento
 */
export function calculateExpiryDate(dateStr: string, days: number): string {
  const expiryDate = new Date(new Date(dateStr).getTime() + days * 86400000);
  return expiryDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}
