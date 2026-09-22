using PaymentLab.Api.Services;

namespace PaymentLab.Api.Endpoints;

public static class RefundEndpoints
{
    public static IEndpointRouteBuilder MapRefundEndpoints(this IEndpointRouteBuilder app)
    {
        // POST /api/transactions/{id}/refunds
        // Requires header: Idempotency-Key
        app.MapPost("/api/transactions/{id}/refunds", (
            string id,
            RefundRequest body,
            HttpRequest request,
            RefundService refunds) =>
        {
            var idempotencyKey = request.Headers["Idempotency-Key"].ToString();

            var result = refunds.RefundFull(id, body?.Reason ?? string.Empty, idempotencyKey);

            if (!result.Success)
            {
                var error = new ErrorDto(result.ErrorCode!, result.ErrorMessage!);
                return result.ErrorCode switch
                {
                    "TRANSACTION_NOT_FOUND" => Results.NotFound(error),
                    "TRANSACTION_NOT_REFUNDABLE" => Results.Conflict(error),
                    _ => Results.BadRequest(error)
                };
            }

            return Results.Ok(RefundDto.From(result.Refund!));
        });

        return app;
    }
}
