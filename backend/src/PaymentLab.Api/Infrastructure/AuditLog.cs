namespace PaymentLab.Api.Infrastructure;

public sealed record AuditEntry(
    DateTimeOffset At,
    string Action,
    string SubjectId,
    IReadOnlyDictionary<string, string> Details);

/// <summary>
/// Every money movement must leave an audit entry. The entry is part of the
/// evidence a PJP shows during a BI / internal audit inspection, so it is
/// written inside the same code path as the posting, never "later".
///
/// RED ZONE: details must never contain a full PAN, CVV, NIK, or credentials.
/// </summary>
public interface IAuditLog
{
    void Record(string action, string subjectId, IReadOnlyDictionary<string, string> details);

    IReadOnlyList<AuditEntry> Entries { get; }
}

public sealed class InMemoryAuditLog : IAuditLog
{
    private readonly object _gate = new();
    private readonly List<AuditEntry> _entries = new();

    public void Record(string action, string subjectId, IReadOnlyDictionary<string, string> details)
    {
        lock (_gate)
        {
            _entries.Add(new AuditEntry(DateTimeOffset.UtcNow, action, subjectId, details));
        }
    }

    public IReadOnlyList<AuditEntry> Entries
    {
        get
        {
            lock (_gate)
            {
                return _entries.ToList();
            }
        }
    }
}
