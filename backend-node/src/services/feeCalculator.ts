import { Money } from '../domain/money.js';

/**
 * Port of Services/FeeCalculator.cs.
 *
 * MDR = 0.7% + Rp 500 flat, always FLOORED to a whole rupiah — never
 * Math.round, never MidpointRounding.AwayFromZero. The C# original uses
 * `decimal.Floor`; here the same guarantee is achieved with exact integer
 * arithmetic (units * 7 / 1000, floored) so no floating-point multiply
 * ever touches a stored amount.
 *
 * NOTE — intentional gap, same as the .NET original: there is no
 * `calculateFeeReversal` for partial refunds. Specifying and implementing
 * that formula (floor(fee_charged × refund_amount ÷ gross)) is Lab 1/2's
 * job, not something this file does for you.
 */
export const MDR_NUMERATOR = 7; // 0.7% == 7 / 1000
export const MDR_DENOMINATOR = 1000;
export const FIXED_FEE_UNITS = 500;

export function calculateMerchantFee(gross: Money): Money {
  const percentagePart = Math.floor((gross.units * MDR_NUMERATOR) / MDR_DENOMINATOR);
  return Money.idr(percentagePart + FIXED_FEE_UNITS);
}
