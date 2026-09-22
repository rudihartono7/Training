import { Refund, Transaction } from '../domain/transaction.js';

/**
 * Port of Infrastructure/ITransactionStore.cs + InMemoryTransactionStore.cs.
 *
 * The C# version takes a `lock` for atomicity because .NET can run request
 * handlers on multiple threads. Node's event loop is single-threaded, so an
 * equivalent lock is not needed here for the synchronous Map operations
 * below — but if this store is ever made to `await` between reading and
 * writing (e.g. a real DB call), that atomicity guarantee has to be
 * rebuilt explicitly. Do not assume single-threaded safety survives an
 * async rewrite.
 */
export interface TransactionStore {
  findById(id: string): Transaction | undefined;
  list(merchantId?: string): Transaction[];
  seed(transactions: Transaction[]): void;

  findRefundByIdempotencyKey(key: string): Refund | undefined;
  appendRefund(transactionId: string, refund: Refund): void;
}

export class InMemoryTransactionStore implements TransactionStore {
  private byId = new Map<string, Transaction>();
  private refundByIdempotencyKey = new Map<string, Refund>();

  seed(transactions: Transaction[]): void {
    for (const t of transactions) {
      this.byId.set(t.id, t);
    }
  }

  findById(id: string): Transaction | undefined {
    return this.byId.get(id);
  }

  list(merchantId?: string): Transaction[] {
    const all = [...this.byId.values()];
    if (!merchantId) return all;
    return all.filter((t) => t.merchantId === merchantId);
  }

  findRefundByIdempotencyKey(key: string): Refund | undefined {
    return this.refundByIdempotencyKey.get(key);
  }

  appendRefund(transactionId: string, refund: Refund): void {
    const transaction = this.byId.get(transactionId);
    if (!transaction) throw new Error(`Unknown transaction: ${transactionId}`);
    transaction.refunds.push(refund);
    this.refundByIdempotencyKey.set(refund.idempotencyKey, refund);
  }
}
