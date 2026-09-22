using PaymentLab.Api.Domain;

namespace PaymentLab.Api.Services;

public sealed record RefundResult(
    bool Success,
    string? ErrorCode,
    string? ErrorMessage,
    Refund? Refund)
{
    public static RefundResult Ok(Refund refund) => new(true, null, null, refund);

    public static RefundResult Fail(string code, string message) => new(false, code, message, null);
}
