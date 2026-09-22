using PaymentLab.Api.Domain;

namespace PaymentLab.Api.Infrastructure;

public interface ITransactionStore
{
    Transaction? Find(string id);

    IReadOnlyList<Transaction> All();

    /// <summary>Returns the refund already posted under this key, if any.</summary>
    Refund? FindRefundByIdempotencyKey(string idempotencyKey);

    /// <summary>Appends the refund and persists the new transaction status atomically.</summary>
    void AddRefund(Transaction transaction, Refund refund, TransactionStatus newStatus);
}
