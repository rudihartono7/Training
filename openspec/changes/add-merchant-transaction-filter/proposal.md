# Filter transactions by merchant

> Demo change used in the opening 10 minutes of the workshop. Small, read-only,
> no red zone — deliberately the easiest possible thing an agent can carry from
> spec to green test, so the loop is visible in under three minutes.

## Why

Back-office operators work one merchant at a time. Today `GET /api/transactions`
returns every transaction in the ledger and the operator filters by eye, which
does not survive more than a screenful of data.

## What changes

Add an optional `merchantId` query parameter to `GET /api/transactions`.
When present, only that merchant's transactions are returned. When absent,
behaviour is unchanged.

## Impact

- `backend/src/PaymentLab.Api/Endpoints/TransactionEndpoints.cs`
- `backend/tests/PaymentLab.Api.Tests/` — new endpoint-level tests
- No frontend change in this proposal.

## Red zones

None. Read-only, no amounts, no configuration, no personal data beyond the
already-masked PAN that the endpoint returns today.

## Approver

Tech lead. No compliance sign-off needed.
