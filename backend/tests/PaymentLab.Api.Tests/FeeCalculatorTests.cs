using PaymentLab.Api.Domain;
using PaymentLab.Api.Services;
using Xunit;

namespace PaymentLab.Api.Tests;

public class FeeCalculatorTests
{
    private readonly FeeCalculator _fees = new();

    [Theory]
    // gross,   expected fee  (0.7% floored, plus Rp 500 flat)
    [InlineData(150_000, 1_550)]
    [InlineData(99_999, 1_199)]    // 699.993 floors to 699, never 700
    [InlineData(1_250_500, 9_253)] // 8753.5 floors to 8753, never 8754
    [InlineData(45_000, 815)]
    [InlineData(777_777, 5_944)]
    [InlineData(0, 500)]
    public void CalculateMerchantFee_floors_the_variable_part(long grossUnits, long expectedFeeUnits)
    {
        var fee = _fees.CalculateMerchantFee(Money.Idr(grossUnits));

        Assert.Equal(expectedFeeUnits, fee.Units);
        Assert.Equal("IDR", fee.Currency);
    }

    [Fact]
    public void CalculateMerchantFee_rejects_negative_gross()
    {
        Assert.Throws<ArgumentOutOfRangeException>(
            () => _fees.CalculateMerchantFee(Money.Idr(-1)));
    }
}
