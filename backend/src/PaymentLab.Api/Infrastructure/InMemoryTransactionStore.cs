using PaymentLab.Api.Domain;

namespace PaymentLab.Api.Infrastructure;

/// <summary>
/// Lab substitute for the real ledger. Single process, no persistence.
/// The locking here stands in for the database transaction in production:
/// keep refund append + status change inside one critical section.
/// </summary>
public sealed class InMemoryTransactionStore : ITransactionStore
{
    private readonly object _gate = new();
    private readonly Dictionary<string, Transaction> _transactions = new(StringComparer.Ordinal);
    private readonly Dictionary<string, Refund> _refundsByIdempotencyKey = new(StringComparer.Ordinal);

    public InMemoryTransactionStore(IEnumerable<Transaction> seed)
    {
        foreach (var transaction in seed)
        {
            _transactions[transaction.Id] = transaction;
        }
    }

    public Transaction? Find(string id)
    {
        lock (_gate)
        {
            return _transactions.TryGetValue(id, out var transaction) ? transaction : null;
        }
    }

    public IReadOnlyList<Transaction> All()
    {
        lock (_gate)
        {
            return _transactions.Values.OrderBy(t => t.AuthorizedAt).ToList();
        }
    }

    public Refund? FindRefundByIdempotencyKey(string idempotencyKey)
    {
        lock (_gate)
        {
            return _refundsByIdempotencyKey.TryGetValue(idempotencyKey, out var refund) ? refund : null;
        }
    }

    public void AddRefund(Transaction transaction, Refund refund, TransactionStatus newStatus)
    {
        lock (_gate)
        {
            if (_refundsByIdempotencyKey.ContainsKey(refund.IdempotencyKey))
            {
                throw new InvalidOperationException(
                    $"Duplicate idempotency key '{refund.IdempotencyKey}'.");
            }

            transaction.Refunds.Add(refund);
            transaction.Status = newStatus;
            _refundsByIdempotencyKey[refund.IdempotencyKey] = refund;
        }
    }
}
