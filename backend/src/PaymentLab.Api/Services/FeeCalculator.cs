using PaymentLab.Api.Domain;

namespace PaymentLab.Api.Services;

/// <summary>
/// Merchant fee (MDR) arithmetic.
///
/// CONVENTION FOR THIS WHOLE CLASS: every fee amount is floored to a whole rupiah.
/// Flooring is deliberate — the PJP must never charge, and never reverse,
/// a fraction more than the exact figure. Do not "improve" this to Math.Round.
/// </summary>
public sealed class FeeCalculator
{
    /// <summary>Merchant discount rate: 0.7% of the principal.</summary>
    public const decimal MdrRate = 0.007m;

    /// <summary>Flat per-transaction fee, in IDR.</summary>
    public const long FixedFeeUnits = 500;

    public Money CalculateMerchantFee(Money gross)
    {
        if (gross.IsNegative)
        {
            throw new ArgumentOutOfRangeException(nameof(gross), "Gross amount must not be negative.");
        }

        var variable = (long)decimal.Floor(gross.Units * MdrRate);
        return new Money(variable + FixedFeeUnits, gross.Currency);
    }
}
