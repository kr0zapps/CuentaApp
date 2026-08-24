/**
 * Formatea un número como pesos chilenos (CLP)
 * Ejemplo: 1234567 → "$1.234.567"
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Versión compacta para dashboards
 * Ejemplo: 1500000 → "$1,5M" | 234000 → "$234K"
 */
export function formatCLPCorto(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return formatCLP(amount);
}

/**
 * Convierte string de input numérico a entero CLP
 * Remueve puntos, comas, signo $
 */
export function parseCLP(input: string): number {
  const clean = input.replace(/[$.,\s]/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Formatea el texto de un input mientras se escribe para mostrar $xx.xxx
 */
export function formatCurrencyInput(input: string): string {
  const clean = input.replace(/\D/g, '');
  if (!clean) return '';
  const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${formatted}`;
}
