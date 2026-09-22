# Tasks

- [ ] 1. Add the optional `merchantId` query parameter to the `GET /` handler in
      `TransactionEndpoints.cs`, treating null/blank as "no filter".
      Check: `dotnet build backend/PaymentLab.sln` is clean.
- [ ] 2. Add tests covering all four scenarios in the delta spec.
      Check: `dotnet test backend/PaymentLab.sln` is green and the new tests fail
      if the filter is removed.
- [ ] 3. Run `./scripts/verify.sh` and report what changed, what is covered,
      and anything deliberately left out.
