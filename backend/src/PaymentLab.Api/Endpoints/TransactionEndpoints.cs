using PaymentLab.Api.Infrastructure;

namespace PaymentLab.Api.Endpoints;

public static class TransactionEndpoints
{
    public static IEndpointRouteBuilder MapTransactionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/transactions");

        group.MapGet("/", (ITransactionStore store) =>
            Results.Ok(store.All().Select(TransactionDto.From).ToList()));

        group.MapGet("/{id}", (string id, ITransactionStore store) =>
        {
            var transaction = store.Find(id);
            return transaction is null
                ? Results.NotFound(new ErrorDto("TRANSACTION_NOT_FOUND", "Transaction not found."))
                : Results.Ok(TransactionDto.From(transaction));
        });

        return app;
    }
}
