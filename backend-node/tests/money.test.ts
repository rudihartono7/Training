import { describe, expect, it } from 'vitest';
import { Money } from '../src/domain/money.js';

describe('Money', () => {
  it('adds amounts in the same currency', () => {
    expect(Money.idr(1000).add(Money.idr(500)).units).toBe(1500);
  });

  it('subtracts amounts in the same currency', () => {
    expect(Money.idr(1000).subtract(Money.idr(300)).units).toBe(700);
  });

  it('throws on currency mismatch (there is only IDR today, but the guard must exist)', () => {
    const idr = Money.idr(1000);
    // @ts-expect-error — deliberately constructing a mismatched currency for the guard test
    const fake = { units: 500, currency: 'USD' } as Money;
    expect(() => idr.add(fake)).toThrow(/Currency mismatch/);
  });

  it('rejects a non-integer amount', () => {
    expect(() => Money.idr(1000.5)).toThrow(/integer/);
  });

  it('zeroLike preserves currency at zero', () => {
    const z = Money.zeroLike(Money.idr(999));
    expect(z.units).toBe(0);
    expect(z.currency).toBe('IDR');
  });

  it('compares amounts', () => {
    expect(Money.idr(1000).greaterThan(Money.idr(999))).toBe(true);
    expect(Money.idr(999).lessThan(Money.idr(1000))).toBe(true);
    expect(Money.idr(1000).equals(Money.idr(1000))).toBe(true);
  });
});
