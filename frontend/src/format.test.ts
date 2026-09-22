import { describe, expect, it } from 'vitest';
import { formatMoney, parseRupiah } from './format';

describe('formatMoney', () => {
  it('renders IDR with thousand separators', () => {
    expect(formatMoney({ units: 1250500, currency: 'IDR' })).toBe('Rp 1.250.500');
  });

  it('renders zero', () => {
    expect(formatMoney({ units: 0, currency: 'IDR' })).toBe('Rp 0');
  });

  it('falls back to the currency code for anything not IDR', () => {
    expect(formatMoney({ units: 1200, currency: 'USD' })).toBe('USD 1.200');
  });
});

describe('parseRupiah', () => {
  it('accepts plain digits', () => {
    expect(parseRupiah('150000')).toBe(150000);
  });

  it('accepts a formatted amount', () => {
    expect(parseRupiah('Rp 150.000')).toBe(150000);
  });

  it('rejects fractions and junk', () => {
    expect(parseRupiah('150000,50')).toBeNull();
    expect(parseRupiah('-150000')).toBeNull();
    expect(parseRupiah('abc')).toBeNull();
    expect(parseRupiah('')).toBeNull();
  });
});
