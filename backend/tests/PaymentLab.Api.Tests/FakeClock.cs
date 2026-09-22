namespace PaymentLab.Api.Tests;

/// <summary>
/// Minimal controllable clock. Kept dependency-free on purpose so the test
/// project restores with nothing but xunit.
/// </summary>
public sealed class FakeClock : TimeProvider
{
    private DateTimeOffset _now;

    public FakeClock(DateTimeOffset now) => _now = now;

    public override DateTimeOffset GetUtcNow() => _now;

    public void Advance(TimeSpan by) => _now = _now.Add(by);
}
