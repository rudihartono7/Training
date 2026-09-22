using PaymentLab.Api.Domain;
using PaymentLab.Api.Services;

namespace PaymentLab.Api.Infrastructure;

public static class SeedData
{
    /// <summary>
    /// Deterministic fixtures. Amounts are chosen so that 0.7% MDR lands on
    /// awkward fractions — that is where rounding bugs show up.
    /// </summary>
    public static IReadOnlyList<Transaction> Transactions(DateTimeOffset now)
    {
        var fees = new FeeCalculator();

        Transaction Make(
            string id,
            string merchantId,
            long grossUnits,
            int daysAgo,
            string maskedPan,
            TransactionStatus status = TransactionStatus.Settled)
        {
            var gross = Money.Idr(grossUnits);
            return new Transaction
            {
                Id = id,
                MerchantId = merchantId,
                Gross = gross,
                MerchantFee = fees.CalculateMerchantFee(gross),
                AuthorizedAt = now.AddDays(-daysAgo),
                MaskedPan = maskedPan,
                Status = status
            };
        }

        return new List<Transaction>
        {
            Make("trx_1001", "mch_warungkopi", 150_000, 2, "455612******1234"),
            Make("trx_1002", "mch_warungkopi", 99_999, 9, "455612******7788"),
            Make("trx_1003", "mch_tokobuku", 1_250_500, 31, "521234******4321"),
            Make("trx_1004", "mch_tokobuku", 45_000, 120, "521234******9090"),
            Make("trx_1005", "mch_apotekseha", 777_777, 14, "400012******5555"),
            Make("trx_1006", "mch_apotekseha", 250_000, 5, "400012******6666", TransactionStatus.Failed)
        };
    }
}
