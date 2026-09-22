# Transactions — delta spec

## ADDED Requirements

### Requirement: Filter the transaction list by merchant

`GET /api/transactions` SHALL accept an optional `merchantId` query parameter
and return only the transactions belonging to that merchant.

#### Scenario: Merchant filter returns only that merchant

- **GIVEN** the seeded ledger contains two transactions for `mch_warungkopi`
  and two for `mch_tokobuku`
- **WHEN** the client calls `GET /api/transactions?merchantId=mch_warungkopi`
- **THEN** the response is `200` and contains exactly the two
  `mch_warungkopi` transactions, ordered by `authorizedAt` ascending

#### Scenario: No filter returns everything

- **GIVEN** the seeded ledger
- **WHEN** the client calls `GET /api/transactions`
- **THEN** the response is `200` and contains every seeded transaction

#### Scenario: Unknown merchant returns an empty list

- **GIVEN** no transaction belongs to `mch_ghost`
- **WHEN** the client calls `GET /api/transactions?merchantId=mch_ghost`
- **THEN** the response is `200` and the body is an empty array, not `404`

#### Scenario: Blank merchant is treated as no filter

- **GIVEN** the seeded ledger
- **WHEN** the client calls `GET /api/transactions?merchantId=`
- **THEN** the response is `200` and contains every seeded transaction

## Out of scope

- Paging, sorting options, and free-text search.
- Any change to the transaction payload shape.
- Frontend wiring.

## Files the agent may touch

- `backend/src/PaymentLab.Api/Endpoints/TransactionEndpoints.cs`
- `backend/tests/PaymentLab.Api.Tests/**`

## Files the agent must not touch

- Anything under `backend/src/PaymentLab.Api/Domain/` or `Services/`
- `appsettings*.json`
