using PaymentLab.Api.Domain;
using PaymentLab.Api.Infrastructure;
using PaymentLab.Api.Services;

namespace PaymentLab.SelfCheck;

/// <summary>
/// Dependency-free smoke check for the refund domain.
///
/// Why this exists: on a locked-down corporate laptop nuget.org is often
/// blocked, and then `dotnet test` cannot restore xunit. This harness runs the
/// same assertions with nothing but the .NET shared framework, so a participant
/// is never blocked from doing the lab. `dotnet test` stays the real suite.
/// </summary>
public static class Program
{
    private static int _passed;
    private static readonly List<string> Failures = new();

    public static int Main()
    {
        Console.WriteLine("PaymentLab self-check (offline harness)");
        Console.WriteLine(new string('-', 46));

        MoneyChecks();
        FeeChecks();
        RefundChecks();

        Console.WriteLine(new string('-', 46));
        if (Failures.Count == 0)
        {
            Console.WriteLine($"PASS  {_passed} checks green.");
            return 0;
        }

        Console.WriteLine($"FAIL  {Failures.Count} of {_passed + Failures.Count} checks red:");
        foreach (var failure in Failures)
        {
            Console.WriteLine("  - " + failure);
        }

        return 1;
    }

    private static void MoneyChecks()
    {
        Check("money adds", Money.Idr(150_000).Add(Money.Idr(2_500)).Units == 152_500);
        Check("money subtracts below zero", Money.Idr(1_000).Subtract(Money.Idr(2_500)).Units == -1_500);
        Check("zeroLike keeps currency", Money.ZeroLike(new Money(99, "USD")).Currency == "USD");
        Throws<InvalidOperationException>("mixed currency add throws",
            () => Money.Idr(1).Add(new Money(1, "USD")));
    }

    private static void FeeChecks()
    {
        var fees = new FeeCalculator();
        var cases = new (long Gross, long Expected)[]
        {
            (150_000, 1_550),
            (99_999, 1_199),
            (1_250_500, 9_253),
            (45_000, 815),
            (777_777, 5_944),
            (0, 500)
        };

        foreach (var (gross, expected) in cases)
        {
            var actual = fees.CalculateMerchantFee(Money.Idr(gross)).Units;
            Check($"fee for {gross:N0} is {expected:N0} (got {actual:N0})", actual == expected);
        }

        Throws<ArgumentOutOfRangeException>("negative gross rejected",
            () => fees.CalculateMerchantFee(Money.Idr(-1)));
    }

    private static readonly DateTimeOffset Now = new(2026, 3, 1, 0, 0, 0, TimeSpan.Zero);

    private static Transaction Settled(
        string id = "trx_1",
        long grossUnits = 150_000,
        int daysAgo = 3,
        TransactionStatus status = TransactionStatus.Settled)
    {
        var gross = Money.Idr(grossUnits);
        return new Transaction
        {
            Id = id,
            MerchantId = "mch_test",
            Gross = gross,
            MerchantFee = new FeeCalculator().CalculateMerchantFee(gross),
            AuthorizedAt = Now.AddDays(-daysAgo),
            MaskedPan = "455612******1234",
            Status = status
        };
    }

    private static (RefundService Service, InMemoryAuditLog Audit) Build(params Transaction[] transactions)
    {
        var store = new InMemoryTransactionStore(transactions);
        var audit = new InMemoryAuditLog();
        return (new RefundService(store, new FeeCalculator(), audit, new FixedClock(Now)), audit);
    }

    private static void RefundChecks()
    {
        var transaction = Settled();
        var (service, audit) = Build(transaction);
        var result = service.RefundFull(transaction.Id, "customer cancelled", "key-1");
        Check("full refund succeeds", result.Success);
        Check("full refund returns principal", result.Refund!.Amount.Units == 150_000);
        Check("full refund reverses whole fee", result.Refund.FeeReversed.Units == 1_550);
        Check("status becomes Refunded", transaction.Status == TransactionStatus.Refunded);
        Check("nothing left to refund", transaction.RefundableRemaining().IsZero);
        Check("one audit entry", audit.Entries.Count == 1);
        Check("audit carries no card data",
            !audit.Entries[0].Details.Values.Any(v => v.Contains("4556", StringComparison.Ordinal)));

        var replay = service.RefundFull(transaction.Id, "customer cancelled", "key-1");
        Check("replay returns the original refund", replay.Success && replay.Refund!.Id == result.Refund.Id);
        Check("replay does not post twice", transaction.Refunds.Count == 1);

        CheckFailure("blank idempotency key", Settled(), (s, t) => s.RefundFull(t.Id, "x", " "), "IDEMPOTENCY_KEY_REQUIRED");
        CheckFailure("blank reason", Settled(), (s, t) => s.RefundFull(t.Id, "", "key-1"), "REASON_REQUIRED");
        CheckFailure("unknown transaction", Settled(), (s, _) => s.RefundFull("trx_nope", "x", "key-1"), "TRANSACTION_NOT_FOUND");
        CheckFailure("not settled", Settled(status: TransactionStatus.Failed), (s, t) => s.RefundFull(t.Id, "x", "key-1"), "TRANSACTION_NOT_REFUNDABLE");
        CheckFailure("past refund window", Settled(daysAgo: 120), (s, t) => s.RefundFull(t.Id, "x", "key-1"), "REFUND_WINDOW_EXPIRED");

        var edge = Settled(daysAgo: 90);
        var (edgeService, _) = Build(edge);
        Check("day 90 is still inside the window",
            edgeService.RefundFull(edge.Id, "x", "key-1").Success);
    }

    private static void CheckFailure(
        string label,
        Transaction transaction,
        Func<RefundService, Transaction, RefundResult> act,
        string expectedCode)
    {
        var (service, _) = Build(transaction);
        var result = act(service, transaction);
        Check($"{label} -> {expectedCode} (got {result.ErrorCode ?? "success"})",
            !result.Success && result.ErrorCode == expectedCode);
    }

    private static void Check(string label, bool condition)
    {
        if (condition)
        {
            _passed++;
            Console.WriteLine("  ok   " + label);
        }
        else
        {
            Failures.Add(label);
            Console.WriteLine("  FAIL " + label);
        }
    }

    private static void Throws<TException>(string label, Action action)
        where TException : Exception
    {
        try
        {
            action();
            Check(label, false);
        }
        catch (TException)
        {
            Check(label, true);
        }
        catch (Exception ex)
        {
            Check($"{label} (threw {ex.GetType().Name})", false);
        }
    }

    private sealed class FixedClock : TimeProvider
    {
        private readonly DateTimeOffset _now;

        public FixedClock(DateTimeOffset now) => _now = now;

        public override DateTimeOffset GetUtcNow() => _now;
    }
}
