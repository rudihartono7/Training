namespace PaymentLab.Api.Domain;

/// <summary>
/// Business constants for refunds. Changing any value here is a RED ZONE change:
/// it moves money and it is covered by the merchant agreement.
/// </summary>
public static class RefundPolicy
{
    /// <summary>A transaction can only be refunded within this window of authorisation.</summary>
    public static readonly TimeSpan Window = TimeSpan.FromDays(90);

    /// <summary>Smallest refund the system will post, in IDR.</summary>
    public const long MinimumUnits = 1_000;
}
