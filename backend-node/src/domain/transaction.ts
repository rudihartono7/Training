import { Money } from './money.js';

/** Port of Domain/TransactionStatus.cs. */
export type TransactionStatus = 'Settled' | 'PartiallyRefunded' | 'Refunded' | 'Failed';

/** Port of Domain/Refund.cs. */
export interface Refund {
  id: string;
  transactionId: string;
  amount: Money;
  feeReversed: Money;
  reason: string;
  idempotencyKey: string;
  createdAt: Date;
}

/** Port of Domain/Transaction.cs. */
export class Transaction {
  readonly id: string;
  readonly merchantId: string;
  readonly gross: Money;
  readonly merchantFee: Money;
  readonly maskedPan: string;
  readonly createdAt: Date;
  status: TransactionStatus;
  readonly refunds: Refund[] = [];

  constructor(params: {
    id: string;
    merchantId: string;
    gross: Money;
    merchantFee: Money;
    maskedPan: string;
    createdAt: Date;
    status: TransactionStatus;
  }) {
    this.id = params.id;
    this.merchantId = params.merchantId;
    this.gross = params.gross;
    this.merchantFee = params.merchantFee;
    this.maskedPan = params.maskedPan;
    this.createdAt = params.createdAt;
    this.status = params.status;
  }

  totalRefunded(): Money {
    return this.refunds.reduce((sum, r) => sum.add(r.amount), Money.zeroLike(this.gross));
  }

  totalFeeReversed(): Money {
    return this.refunds.reduce((sum, r) => sum.add(r.feeReversed), Money.zeroLike(this.merchantFee));
  }

  /** Remaining principal that can still be refunded. Compare against THIS, never against `gross` directly. */
  refundableRemaining(): Money {
    return this.gross.subtract(this.totalRefunded());
  }
}
