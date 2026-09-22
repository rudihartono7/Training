namespace PaymentLab.Api.Domain;

/// <summary>
/// One refund posting against a transaction.
/// <paramref name="FeeReversed"/> is the part of the merchant fee (MDR) given back
/// to the merchant for this refund.
/// </summary>
public sealed record Refund(
    string Id,
    string TransactionId,
    Money Amount,
    Money FeeReversed,
    string Reason,
    string IdempotencyKey,
    DateTimeOffset CreatedAt);
