import { describe, expect, it } from 'vitest';
import { Money } from '../src/domain/money.js';
import { calculateMerchantFee } from '../src/services/feeCalculator.js';

// Same verified fraction cases used in the deck and the .NET test suite.
const cases: Array<[gross: number, expectedFee: number]> = [
  [150000, 1550],
  [99999, 1199],
  [1250500, 9253],
  [45000, 815],
  [777777, 5944],
  [1000, 507]
];

describe('calculateMerchantFee', () => {
  it.each(cases)('floors gross %i to fee %i (0.7%% + Rp500, never rounded)', (gross, expectedFee) => {
    expect(calculateMerchantFee(Money.idr(gross)).units).toBe(expectedFee);
  });

  it('never returns a fractional unit', () => {
    for (const [gross] of cases) {
      expect(Number.isInteger(calculateMerchantFee(Money.idr(gross)).units)).toBe(true);
    }
  });
});
