using PaymentLab.Api.Endpoints;
using PaymentLab.Api.Infrastructure;
using PaymentLab.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<FeeCalculator>();
builder.Services.AddSingleton<IAuditLog, InMemoryAuditLog>();
builder.Services.AddSingleton<ITransactionStore>(_ =>
    new InMemoryTransactionStore(SeedData.Transactions(DateTimeOffset.UtcNow)));
builder.Services.AddSingleton<RefundService>();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

app.MapGet("/", () => Results.Ok(new
{
    service = "PaymentLab.Api",
    routes = new[]
    {
        "GET  /api/transactions",
        "GET  /api/transactions/{id}",
        "POST /api/transactions/{id}/refunds  (header: Idempotency-Key)",
        "GET  /api/audit"
    }
}));

app.MapGet("/api/audit", (IAuditLog audit) => Results.Ok(audit.Entries));

app.MapTransactionEndpoints();
app.MapRefundEndpoints();

app.Run();

/// <summary>Exposed so the test project can spin up the API in-process.</summary>
public partial class Program;
