using PaymentLab.Api.Domain;

namespace PaymentLab.Api.Endpoints;

public sealed record MoneyDto(long Units, string Currency)
{
    public static MoneyDto From(Money money) => new(money.Units, money.Currency);
}

public sealed record RefundDto(
    string Id,
    string TransactionId,
    MoneyDto Amount,
    MoneyDto FeeReversed,
    string Reason,
    DateTimeOffset CreatedAt)
{
    public static RefundDto From(Refund refund) => new(
        refund.Id,
        refund.TransactionId,
        MoneyDto.From(refund.Amount),
        MoneyDto.From(refund.FeeReversed),
        refund.Reason,
        refund.CreatedAt);
}

public sealed record TransactionDto(
    string Id,
    string MerchantId,
    MoneyDto Gross,
    MoneyDto MerchantFee,
    MoneyDto TotalRefunded,
    MoneyDto RefundableRemaining,
    string Status,
    string MaskedPan,
    DateTimeOffset AuthorizedAt,
    IReadOnlyList<RefundDto> Refunds)
{
    public static TransactionDto From(Transaction transaction) => new(
        transaction.Id,
        transaction.MerchantId,
        MoneyDto.From(transaction.Gross),
        MoneyDto.From(transaction.MerchantFee),
        MoneyDto.From(transaction.TotalRefunded()),
        MoneyDto.From(transaction.RefundableRemaining()),
        transaction.Status.ToString(),
        transaction.MaskedPan,
        transaction.AuthorizedAt,
        transaction.Refunds.Select(RefundDto.From).ToList());
}

/// <summary>Body of POST /api/transactions/{id}/refunds.</summary>
public sealed record RefundRequest(string Reason);

public sealed record ErrorDto(string Code, string Message);
