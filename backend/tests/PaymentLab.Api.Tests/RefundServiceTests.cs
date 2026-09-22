using PaymentLab.Api.Domain;
using PaymentLab.Api.Infrastructure;
using PaymentLab.Api.Services;
using Xunit;

namespace PaymentLab.Api.Tests;

public class RefundServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 3, 1, 0, 0, 0, TimeSpan.Zero);

    private static (RefundService service, InMemoryTransactionStore store, InMemoryAuditLog audit) Build(
        params Transaction[] transactions)
    {
        var store = new InMemoryTransactionStore(transactions);
        var audit = new InMemoryAuditLog();
        var service = new RefundService(store, new FeeCalculator(), audit, new FakeClock(Now));
        return (service, store, audit);
    }

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

    [Fact]
    public void RefundFull_reverses_principal_and_whole_fee()
    {
        var transaction = Settled();
        var (service, _, _) = Build(transaction);

        var result = service.RefundFull(transaction.Id, "customer cancelled", "key-1");

        Assert.True(result.Success);
        Assert.Equal(150_000, result.Refund!.Amount.Units);
        Assert.Equal(1_550, result.Refund.FeeReversed.Units);
        Assert.Equal(TransactionStatus.Refunded, transaction.Status);
        Assert.True(transaction.RefundableRemaining().IsZero);
    }

    [Fact]
    public void RefundFull_writes_an_audit_entry_without_card_data()
    {
        var transaction = Settled();
        var (service, _, audit) = Build(transaction);

        service.RefundFull(transaction.Id, "customer cancelled", "key-1");

        var entry = Assert.Single(audit.Entries);
        Assert.Equal("refund.full.posted", entry.Action);
        Assert.Equal(transaction.Id, entry.SubjectId);
        Assert.DoesNotContain(entry.Details.Values, value => value.Contains("4556", StringComparison.Ordinal));
    }

    [Fact]
    public void RefundFull_is_idempotent_and_never_posts_twice()
    {
        var transaction = Settled();
        var (service, _, _) = Build(transaction);

        var first = service.RefundFull(transaction.Id, "customer cancelled", "key-1");
        var replay = service.RefundFull(transaction.Id, "customer cancelled", "key-1");

        Assert.True(replay.Success);
        Assert.Equal(first.Refund!.Id, replay.Refund!.Id);
        Assert.Single(transaction.Refunds);
    }

    [Fact]
    public void RefundFull_requires_an_idempotency_key()
    {
        var transaction = Settled();
        var (service, _, _) = Build(transaction);

        var result = service.RefundFull(transaction.Id, "customer cancelled", "  ");

        Assert.False(result.Success);
        Assert.Equal("IDEMPOTENCY_KEY_REQUIRED", result.ErrorCode);
        Assert.Empty(transaction.Refunds);
    }

    [Fact]
    public void RefundFull_requires_a_reason()
    {
        var transaction = Settled();
        var (service, _, _) = Build(transaction);

        var result = service.RefundFull(transaction.Id, "", "key-1");

        Assert.False(result.Success);
        Assert.Equal("REASON_REQUIRED", result.ErrorCode);
    }

    [Fact]
    public void RefundFull_rejects_an_unknown_transaction()
    {
        var (service, _, _) = Build();

        var result = service.RefundFull("trx_nope", "customer cancelled", "key-1");

        Assert.False(result.Success);
        Assert.Equal("TRANSACTION_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public void RefundFull_rejects_a_transaction_that_is_not_settled()
    {
        var transaction = Settled(status: TransactionStatus.Failed);
        var (service, _, _) = Build(transaction);

        var result = service.RefundFull(transaction.Id, "customer cancelled", "key-1");

        Assert.False(result.Success);
        Assert.Equal("TRANSACTION_NOT_REFUNDABLE", result.ErrorCode);
    }

    [Fact]
    public void RefundFull_rejects_a_transaction_past_the_refund_window()
    {
        var transaction = Settled(daysAgo: 120);
        var (service, _, _) = Build(transaction);

        var result = service.RefundFull(transaction.Id, "customer cancelled", "key-1");

        Assert.False(result.Success);
        Assert.Equal("REFUND_WINDOW_EXPIRED", result.ErrorCode);
        Assert.Empty(transaction.Refunds);
    }

    [Fact]
    public void RefundFull_accepts_the_last_day_of_the_refund_window()
    {
        var transaction = Settled(daysAgo: 90);
        var (service, _, _) = Build(transaction);

        var result = service.RefundFull(transaction.Id, "customer cancelled", "key-1");

        Assert.True(result.Success);
    }
}
