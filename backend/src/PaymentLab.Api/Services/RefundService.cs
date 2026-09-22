using PaymentLab.Api.Domain;
using PaymentLab.Api.Infrastructure;

namespace PaymentLab.Api.Services;

/// <summary>
/// Refund posting. Today this service can only reverse a transaction in full.
///
/// Order of checks is part of the contract — idempotency is resolved BEFORE any
/// validation, so a retried request returns the original posting instead of a
/// fresh validation error.
/// </summary>
public sealed class RefundService
{
    private readonly ITransactionStore _store;
    private readonly FeeCalculator _fees;
    private readonly IAuditLog _audit;
    private readonly TimeProvider _clock;

    public RefundService(
        ITransactionStore store,
        FeeCalculator fees,
        IAuditLog audit,
        TimeProvider clock)
    {
        _store = store;
        _fees = fees;
        _audit = audit;
        _clock = clock;
    }

    public RefundResult RefundFull(string transactionId, string reason, string idempotencyKey)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
        {
            return RefundResult.Fail(
                "IDEMPOTENCY_KEY_REQUIRED",
                "Header 'Idempotency-Key' is required for any money movement.");
        }

        var replay = _store.FindRefundByIdempotencyKey(idempotencyKey);
        if (replay is not null)
        {
            return RefundResult.Ok(replay);
        }

        if (string.IsNullOrWhiteSpace(reason))
        {
            return RefundResult.Fail("REASON_REQUIRED", "A refund reason is required.");
        }

        var transaction = _store.Find(transactionId);
        if (transaction is null)
        {
            return RefundResult.Fail("TRANSACTION_NOT_FOUND", "Transaction not found.");
        }

        if (transaction.Status is not TransactionStatus.Settled)
        {
            return RefundResult.Fail(
                "TRANSACTION_NOT_REFUNDABLE",
                $"Transaction is {transaction.Status} and cannot be refunded in full.");
        }

        if (_clock.GetUtcNow() - transaction.AuthorizedAt > RefundPolicy.Window)
        {
            return RefundResult.Fail(
                "REFUND_WINDOW_EXPIRED",
                $"Refunds are only allowed within {RefundPolicy.Window.TotalDays:N0} days of authorisation.");
        }

        var refund = new Refund(
            Id: NewRefundId(),
            TransactionId: transaction.Id,
            Amount: transaction.Gross,
            FeeReversed: transaction.MerchantFee,
            Reason: reason,
            IdempotencyKey: idempotencyKey,
            CreatedAt: _clock.GetUtcNow());

        _store.AddRefund(transaction, refund, TransactionStatus.Refunded);

        _audit.Record(
            action: "refund.full.posted",
            subjectId: transaction.Id,
            details: new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["refundId"] = refund.Id,
                ["merchantId"] = transaction.MerchantId,
                ["amount"] = refund.Amount.ToString(),
                ["feeReversed"] = refund.FeeReversed.ToString(),
                ["reason"] = reason,
                ["idempotencyKey"] = idempotencyKey
            });

        return RefundResult.Ok(refund);
    }

    internal static string NewRefundId() => "rfn_" + Guid.NewGuid().ToString("N")[..12];
}
