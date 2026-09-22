namespace PaymentLab.Api.Domain;

/// <summary>
/// An amount of money, stored as a whole number of the smallest transactable unit
/// of its currency. In this system IDR has NO sub-unit: 1 unit == Rp 1.
///
/// RED ZONE: never represent money with double/float, never mix currencies,
/// never round with the default MidpointRounding. See CLAUDE.md > Money rules.
/// </summary>
public readonly record struct Money(long Units, string Currency)
{
    public static Money Idr(long units) => new(units, "IDR");

    public static Money ZeroLike(Money other) => new(0, other.Currency);

    public bool IsZero => Units == 0;

    public bool IsNegative => Units < 0;

    public bool IsPositive => Units > 0;

    public Money Add(Money other)
    {
        RequireSameCurrency(other);
        return new Money(checked(Units + other.Units), Currency);
    }

    public Money Subtract(Money other)
    {
        RequireSameCurrency(other);
        return new Money(checked(Units - other.Units), Currency);
    }

    public bool GreaterThan(Money other)
    {
        RequireSameCurrency(other);
        return Units > other.Units;
    }

    public bool LessThan(Money other)
    {
        RequireSameCurrency(other);
        return Units < other.Units;
    }

    private void RequireSameCurrency(Money other)
    {
        if (!string.Equals(Currency, other.Currency, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                $"Currency mismatch: '{Currency}' vs '{other.Currency}'.");
        }
    }

    public override string ToString() => $"{Currency} {Units:N0}";
}
