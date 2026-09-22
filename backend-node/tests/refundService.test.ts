import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryTransactionStore } from '../src/infrastructure/transactionStore.js';
import { InMemoryAuditLog } from '../src/infrastructure/auditLog.js';
import { FixedClock } from '../src/infrastructure/clock.js';
import { RefundService } from '../src/services/refundService.js';
import { seedTransactions } from '../src/infrastructure/seedData.js';

// Port of tests/.../RefundServiceTests.cs — same 9 behaviours.
describe('RefundService.refundFull', () => {
  let store: InMemoryTransactionStore;
  let auditLog: InMemoryAuditLog;
  let clock: FixedClock;
  let service: RefundService;

  beforeEach(() => {
    clock = new FixedClock(new Date('2026-06-15T00:00:00.000Z'));
    store = new InMemoryTransactionStore();
    store.seed(seedTransactions(clock.now()));
    auditLog = new InMemoryAuditLog();
    service = new RefundService(store, auditLog, clock);
  });

  it('succeeds on a settled transaction within the window', () => {
    const result = service.refundFull('trx_1001', 'customer request', 'key-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refund.amount.units).toBe(150000);
      expect(result.replay).toBe(false);
    }
  });

  it('writes an audit entry with no card data on success', () => {
    service.refundFull('trx_1001', 'customer request', 'key-2');
    const entries = auditLog.all();
    expect(entries).toHaveLength(1);
    const details = JSON.stringify(entries[0]!.details);
    expect(details).not.toMatch(/4111|5500|XXXX/);
    expect(entries[0]!.details.refundId).toBeDefined();
  });

  it('replays the same result on a repeated idempotency key', () => {
    const first = service.refundFull('trx_1001', 'customer request', 'key-3');
    const second = service.refundFull('trx_1001', 'a different reason entirely', 'key-3');
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.refund.id).toBe(first.refund.id);
      expect(second.replay).toBe(true);
    }
    expect(auditLog.all()).toHaveLength(1);
  });

  it('rejects a missing idempotency key', () => {
    const result = service.refundFull('trx_1001', 'customer request', undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('rejects a missing reason', () => {
    const result = service.refundFull('trx_1001', undefined, 'key-4');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('REASON_REQUIRED');
  });

  it('rejects an unknown transaction', () => {
    const result = service.refundFull('trx_does_not_exist', 'customer request', 'key-5');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TRANSACTION_NOT_FOUND');
  });

  it('rejects a transaction that is not Settled', () => {
    const result = service.refundFull('trx_1006', 'customer request', 'key-6'); // seeded as Failed
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_STATUS');
  });

  it('rejects a transaction outside the 90-day window', () => {
    // trx_1005 is seeded 89 days before `now`; advance the clock past day 90.
    clock.advanceDays(2);
    const result = service.refundFull('trx_1005', 'customer request', 'key-7');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('REFUND_WINDOW_EXPIRED');
  });

  it('still accepts a transaction exactly on the 90-day boundary', () => {
    // trx_1005 is seeded 89 days before `now`; boundary day (day 90) must still be valid.
    clock.advanceDays(1);
    const result = service.refundFull('trx_1005', 'customer request', 'key-8');
    expect(result.ok).toBe(true);
  });
});
