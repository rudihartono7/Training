import { Money } from '../domain/money.js';
import { Refund } from '../domain/transaction.js';
import { RefundPolicy } from '../domain/refundPolicy.js';
import { Clock } from '../infrastructure/clock.js';
import { TransactionStore } from '../infrastructure/transactionStore.js';
import { AuditLog } from '../infrastructure/auditLog.js';

export type RefundErrorCode =
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'REASON_REQUIRED'
  | 'TRANSACTION_NOT_FOUND'
  | 'INVALID_STATUS'
  | 'REFUND_WINDOW_EXPIRED';

export type RefundResult =
  | { ok: true; refund: Refund; replay: boolean }
  | { ok: false; code: RefundErrorCode; message: string };

let refundSeq = 0;
function nextRefundId(): string {
  refundSeq += 1;
  return `rf_${refundSeq}`;
}

/**
 * Port of Services/RefundService.cs — full refund only. Check order below
 * is binding, exactly as in the .NET original and CLAUDE.md section 6:
 * idempotency key required -> replay lookup -> reason required ->
 * transaction exists -> status is Settled -> within RefundPolicy window ->
 * post refund + status change + audit entry, in the same code path.
 *
 * NOTE — intentional gap, same as the .NET original: there is no
 * `refundPartial`. Partial refunds, with proportional fee reversal
 * compared against `refundableRemaining()` (never `gross`), are Lab
 * 1/2/3 material — not implemented here.
 */
export class RefundService {
  constructor(
    private readonly store: TransactionStore,
    private readonly auditLog: AuditLog,
    private readonly clock: Clock
  ) {}

  refundFull(transactionId: string, reason: string | undefined, idempotencyKey: string | undefined): RefundResult {
    if (!idempotencyKey || idempotencyKey.trim() === '') {
      return { ok: false, code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header is required.' };
    }

    const existing = this.store.findRefundByIdempotencyKey(idempotencyKey);
    if (existing) {
      return { ok: true, refund: existing, replay: true };
    }

    if (!reason || reason.trim() === '') {
      return { ok: false, code: 'REASON_REQUIRED', message: 'reason is required.' };
    }

    const transaction = this.store.findById(transactionId);
    if (!transaction) {
      return { ok: false, code: 'TRANSACTION_NOT_FOUND', message: `No transaction ${transactionId}.` };
    }

    if (transaction.status !== 'Settled') {
      return {
        ok: false,
        code: 'INVALID_STATUS',
        message: `Transaction ${transactionId} is ${transaction.status}, not Settled.`
      };
    }

    const now = this.clock.now();
    const windowEnd = new Date(transaction.createdAt.getTime() + RefundPolicy.windowDays * 24 * 60 * 60 * 1000);
    if (now.getTime() > windowEnd.getTime()) {
      return {
        ok: false,
        code: 'REFUND_WINDOW_EXPIRED',
        message: `Refund window of ${RefundPolicy.windowDays} days has passed for ${transactionId}.`
      };
    }

    const amount = transaction.refundableRemaining();
    const feeReversed = transaction.merchantFee.subtract(transaction.totalFeeReversed());

    const refund: Refund = {
      id: nextRefundId(),
      transactionId,
      amount,
      feeReversed,
      reason,
      idempotencyKey,
      createdAt: now
    };

    this.store.appendRefund(transactionId, refund);
    transaction.status = 'Refunded';

    // Audit entry written in the same code path as the posting.
    // Never include maskedPan, cardholder name, or any card data here.
    this.auditLog.record(
      'refund.full',
      {
        refundId: refund.id,
        merchantId: transaction.merchantId,
        amount: amount.units,
        feeReversed: feeReversed.units,
        reason,
        idempotencyKey
      },
      now
    );

    return { ok: true, refund, replay: false };
  }
}

export function moneyOf(units: number): Money {
  return Money.idr(units);
}
