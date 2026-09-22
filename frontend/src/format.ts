import type { MoneyDto } from './types';

/**
 * Formats an amount for display only.
 *
 * `units` is a whole rupiah. Never do arithmetic on the formatted string, and
 * never send a formatted string back to the API — the server is the only
 * authority on amounts.
 */
export function formatMoney(money: MoneyDto): string {
  if (money.currency !== 'IDR') {
    return `${money.currency} ${money.units.toLocaleString('id-ID')}`;
  }

  return `Rp ${money.units.toLocaleString('id-ID')}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Parses what the operator typed into whole rupiah.
 * Returns null when the input is not a clean whole amount — the caller decides
 * what to show. Accepts "150000", "150.000", "Rp 150.000".
 */
export function parseRupiah(input: string): number | null {
  const cleaned = input.replace(/^Rp\s*/i, '').replace(/\./g, '').trim();
  if (cleaned === '' || !/^\d+$/.test(cleaned)) {
    return null;
  }

  return Number.parseInt(cleaned, 10);
}
