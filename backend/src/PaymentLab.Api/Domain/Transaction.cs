namespace PaymentLab.Api.Domain;

public sealed class Transaction
{
    public required string Id { get; init; }

    public required string MerchantId { get; init; }

    /// <summary>Principal charged to the cardholder.</summary>
    public required Money Gross { get; init; }

    /// <summary>Merchant discount rate fee retained by the PJP at settlement.</summary>
    public required Money MerchantFee { get; init; }

    public required DateTimeOffset AuthorizedAt { get; init; }

    /// <summary>
    /// Already masked at ingestion (6-4 format). The full PAN never enters this service.
    /// RED ZONE: must never be logged, echoed in errors, or widened.
    /// </summary>
    public required string MaskedPan { get; init; }

    public TransactionStatus Status { get; set; } = TransactionStatus.Settled;

    public List<Refund> Refunds { get; init; } = new();

    public Money TotalRefunded()
    {
        var total = Money.ZeroLike(Gross);
        foreach (var refund in Refunds)
        {
            total = total.Add(refund.Amount);
        }

        return total;
    }

    public Money TotalFeeReversed()
    {
        var total = Money.ZeroLike(MerchantFee);
        foreach (var refund in Refunds)
        {
            total = total.Add(refund.FeeReversed);
        }

        return total;
    }

    /// <summary>Principal still available to refund.</summary>
    public Money RefundableRemaining() => Gross.Subtract(TotalRefunded());
}
