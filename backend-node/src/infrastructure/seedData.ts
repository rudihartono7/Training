import { Money } from '../domain/money.js';
import { Transaction } from '../domain/transaction.js';
import { calculateMerchantFee } from '../services/feeCalculator.js';

/**
 * Port of Infrastructure/SeedData.cs. Same six fixture amounts as the .NET
 * version, deliberately chosen to land on fee-rounding fractions:
 * 150000, 99999, 1250500, 45000, 777777, and one Failed at 250000.
 */
export function seedTransactions(now: Date): Transaction[] {
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const rows: Array<{
    id: string;
    merchantId: string;
    gross: number;
    maskedPan: string;
    createdDaysAgo: number;
    status: 'Settled' | 'Failed';
  }> = [
    { id: 'trx_1001', merchantId: 'merchant_a', gross: 150000, maskedPan: '4111-XXXX-XXXX-1111', createdDaysAgo: 3, status: 'Settled' },
    { id: 'trx_1002', merchantId: 'merchant_a', gross: 99999, maskedPan: '4111-XXXX-XXXX-2222', createdDaysAgo: 10, status: 'Settled' },
    { id: 'trx_1003', merchantId: 'merchant_b', gross: 1250500, maskedPan: '5500-XXXX-XXXX-3333', createdDaysAgo: 1, status: 'Settled' },
    { id: 'trx_1004', merchantId: 'merchant_b', gross: 45000, maskedPan: '5500-XXXX-XXXX-4444', createdDaysAgo: 45, status: 'Settled' },
    { id: 'trx_1005', merchantId: 'merchant_c', gross: 777777, maskedPan: '4111-XXXX-XXXX-5555', createdDaysAgo: 89, status: 'Settled' },
    { id: 'trx_1006', merchantId: 'merchant_c', gross: 250000, maskedPan: '5500-XXXX-XXXX-6666', createdDaysAgo: 2, status: 'Failed' }
  ];

  return rows.map((r) => {
    const gross = Money.idr(r.gross);
    return new Transaction({
      id: r.id,
      merchantId: r.merchantId,
      gross,
      merchantFee: calculateMerchantFee(gross),
      maskedPan: r.maskedPan,
      createdAt: daysAgo(r.createdDaysAgo),
      status: r.status
    });
  });
}
