using PaymentLab.Api.Domain;
using Xunit;

namespace PaymentLab.Api.Tests;

public class MoneyTests
{
    [Fact]
    public void Add_sums_units()
    {
        var result = Money.Idr(150_000).Add(Money.Idr(2_500));
        Assert.Equal(152_500, result.Units);
        Assert.Equal("IDR", result.Currency);
    }

    [Fact]
    public void Subtract_can_go_negative()
    {
        var result = Money.Idr(1_000).Subtract(Money.Idr(2_500));
        Assert.Equal(-1_500, result.Units);
        Assert.True(result.IsNegative);
    }

    [Fact]
    public void Mixing_currencies_throws()
    {
        var idr = Money.Idr(1_000);
        var usd = new Money(1_000, "USD");

        Assert.Throws<InvalidOperationException>(() => idr.Add(usd));
        Assert.Throws<InvalidOperationException>(() => idr.GreaterThan(usd));
    }

    [Fact]
    public void ZeroLike_keeps_currency()
    {
        var zero = Money.ZeroLike(new Money(99, "USD"));
        Assert.True(zero.IsZero);
        Assert.Equal("USD", zero.Currency);
    }
}
