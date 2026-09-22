/**
 * Money — port of backend/src/PaymentLab.Api/Domain/Money.cs.
 *
 * Rules (see CLAUDE.md section 3, same rules apply here):
 * 1. `units` is a WHOLE rupiah, stored as a JS `number`. IDR has no sub-unit
 *    in this system, and lab amounts stay far below Number.MAX_SAFE_INTEGER
 *    (2^53 - 1), so integer `number` is safe here — unlike a fractional
 *    amount, which must never be represented as a float.
 * 2. Never store a fractional amount. `units` must always be an integer;
 *    the constructor throws if it is not.
 * 3. Never mix currencies. Money.add/subtract throw on a currency mismatch.
 * 4. All fee arithmetic floors to a whole rupiah — see services/feeCalculator.ts.
 *    Do not introduce Math.round anywhere in money code.
 */

export type Currency = 'IDR';

export class Money {
  readonly units: number;
  readonly currency: Currency;

  private constructor(units: number, currency: Currency) {
    if (!Number.isInteger(units)) {
      throw new Error(`Money.units must be an integer whole-rupiah amount, got ${units}`);
    }
    this.units = units;
    this.currency = currency;
  }

  static idr(units: number): Money {
    return new Money(units, 'IDR');
  }

  static zeroLike(other: Money): Money {
    return new Money(0, other.currency);
  }

  private requireSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  add(other: Money): Money {
    this.requireSameCurrency(other);
    return new Money(this.units + other.units, this.currency);
  }

  subtract(other: Money): Money {
    this.requireSameCurrency(other);
    return new Money(this.units - other.units, this.currency);
  }

  greaterThan(other: Money): boolean {
    this.requireSameCurrency(other);
    return this.units > other.units;
  }

  lessThan(other: Money): boolean {
    this.requireSameCurrency(other);
    return this.units < other.units;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.units === other.units;
  }

  toString(): string {
    return `${this.currency} ${this.units}`;
  }
}
