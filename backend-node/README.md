# PaymentLab backend — Node.js + Express + TypeScript

A full port of `backend/src/PaymentLab.Api` (the .NET reference) to
Node/Express/TS. Same domain, same rules, same intentional gaps — this
replaces the .NET backend for anyone running the lab on this stack instead.

## Layout

```
src/
  domain/          Money, Transaction, Refund, RefundPolicy
  services/        feeCalculator, refundService
  infrastructure/  Clock, TransactionStore, AuditLog, seedData
  endpoints/       DTOs + Express routers
  app.ts           builds the Express app (DI wired by hand)
  server.ts        entry point — listens on :5199
tests/             vitest — port of the xunit suite (22 tests)
```

## Commands

| Task | Command |
| --- | --- |
| Install | `npm install` |
| Run | `npm run dev` (watch mode, tsx) or `npm run build && npm start` |
| Tests | `npm test` |
| Typecheck | `npm run typecheck` |

Listens on `:5199` — same port as the .NET version, so `frontend/` needs no
changes to point at whichever backend is running.

## Money rules — identical intent to CLAUDE.md section 3, ported

1. `Money.units` is a whole rupiah, stored as a JS `number`. IDR has no
   sub-unit; lab amounts stay far below `Number.MAX_SAFE_INTEGER`.
2. The constructor rejects a non-integer amount — no fractional units,
   ever.
3. Currencies never mix; `add`/`subtract` throw on mismatch.
4. Fee arithmetic floors to a whole rupiah using **exact integer division**
   (`floor(units * 7 / 1000) + 500`), not a floating-point multiply. This is
   the same "never round a fee" rule as the .NET version's `decimal.Floor`,
   expressed with an approach that never lets a float touch a stored
   amount in the first place.

## Intentional gaps (same as the .NET original)

- `RefundService.refundFull` only. There is **no** partial-refund method
  and **no** fee-reversal formula for a partial amount — specifying and
  implementing `floor(fee_charged × refund_amount ÷ gross)`, compared
  against `refundableRemaining()` and never against `gross`, is Lab
  1/2/3 material, done by the workshop participant against an OpenSpec
  change — not something this port does for you.
- No database — `InMemoryTransactionStore`, same as the .NET version.
  Restarting the server resets all seeded data and any refunds posted.

## Differences from the .NET version worth knowing before you run a lab on this stack

- **Concurrency model.** The .NET store takes a `lock` because ASP.NET Core
  can run request handlers on multiple threads. Node's event loop is
  single-threaded, so the equivalent lock isn't needed for the synchronous
  `Map` operations in `InMemoryTransactionStore` — but that guarantee does
  **not** survive an async rewrite (e.g. swapping in a real DB call between
  a read and a write). This is called out in a comment at the top of
  `transactionStore.ts`; it's a good candidate for a Lab 3 discussion point
  if this stack is used.
- **Warnings-as-errors.** The C# project treats warnings as errors
  (`PaymentLab.Api.csproj`). TypeScript's `strict` mode plus
  `noUncheckedIndexedAccess` is the equivalent guard here — it is not
  optional, don't loosen it to make a red build pass.
- **No offline/selfcheck fallback.** The .NET side has
  `backend/tools/selfcheck` for when `nuget.org` is proxy-blocked. `npm`
  against the public registry is usually reachable where NuGet isn't; if
  it isn't in your environment, point `npm config set registry` at your
  org's mirror rather than trying to hand-roll an offline harness — that
  was a .NET-specific workaround, not a general pattern to copy here.

## Not wired into the repo's shared tooling yet

This backend stands alone under `backend-node/` and does **not** yet touch:

- `CLAUDE.md` (still describes the .NET layout only)
- `openspec/config.yaml` (context block still says ".NET/React")
- `scripts/verify.sh` (still runs `dotnet test` + the frontend, not this)
- `.claude/settings.json` / `.claude/hooks/redzone-guard.sh` (still name
  `.cs`/`appsettings.Production.json` paths, not this tree)

If you want this to become the backend participants actually use in the
workshop (rather than a parallel option), those four files need updating
too — ask and I'll patch them.
