# PaymentLab — repo context for the agent

Workshop lab repo: *Spec-Driven Agentic Execution — Dari Markdown Spec ke Merged Diff*.
Domain: a simplified **PJP (Penyedia Jasa Pembayaran)** back office — transactions,
merchant fee (MDR), refunds, audit trail.

This file is the contract between the repo and any agent working in it. If a
spec and this file disagree, **stop and ask** — do not pick one silently.

---

## 1. Layout

```
backend/
  src/PaymentLab.Api/          ASP.NET Core 8 minimal API, no database
    Domain/                    Money, Transaction, Refund, RefundPolicy
    Services/                  FeeCalculator, RefundService
    Infrastructure/            ITransactionStore, InMemory*, IAuditLog, SeedData
    Endpoints/                 route mapping + DTOs
  tests/PaymentLab.Api.Tests/  xunit — the real suite
  tools/selfcheck/             dependency-free harness, used only when nuget.org is blocked
frontend/                      React 18 + Vite + TypeScript, vitest
openspec/                      specs and changes (OpenSpec)
labs/                          workshop instructions, templates, artifacts
```

## 2. Commands

| Task | Command |
| --- | --- |
| Backend tests | `dotnet test backend/PaymentLab.sln` |
| Backend run | `dotnet run --project backend/src/PaymentLab.Api` (listens on `:5199`) |
| Backend offline check | `cd backend/tools/selfcheck && dotnet run` |
| Frontend tests | `npm --prefix frontend test` |
| Frontend typecheck + build | `npm --prefix frontend run build` |
| Everything | `./scripts/verify.sh` |

Run `./scripts/verify.sh` before you claim a task is done. "It compiles" is not done.

## 3. Money rules — read before touching any amount

1. Money is `Money(long Units, string Currency)`. `Units` is a **whole rupiah**;
   IDR has no sub-unit in this system.
2. **Never** use `double`, `float`, or `decimal` to carry a stored amount.
   `decimal` is allowed only as an intermediate inside a single calculation.
3. **Never** mix currencies. `Money` throws on mismatch; keep it that way.
4. All fee arithmetic **floors** to a whole rupiah (`decimal.Floor`, or integer
   division). Rationale: the PJP must never charge, and never reverse, a
   fraction more than the exact figure. `Math.Round` in fee code is a defect,
   including `MidpointRounding.AwayFromZero`.
5. A refund can never exceed the principal still outstanding on a transaction.
6. Every money movement is idempotent on `Idempotency-Key` and leaves an
   `IAuditLog` entry written in the same code path as the posting.

## 4. Red zones — stop and ask a human

Changes in these areas require a named human reviewer before commit. The agent
may *propose* a diff; it may not decide the change is fine.

| # | Red zone | Examples in this repo |
| --- | --- | --- |
| R1 | Nominal / monetary logic | `Money`, `FeeCalculator`, `RefundPolicy`, anything that rounds |
| R2 | Sensitive data | `MaskedPan`, audit details, log statements, error messages |
| R3 | Production configuration | `appsettings.Production.json`, connection strings, feature flags, limits |
| R4 | Compliance and audit trail | `IAuditLog` shape, retention, what is recorded, reporting |
| R5 | Idempotency, authn/authz, replay | `Idempotency-Key` handling, store-level duplicate guards |
| R6 | Irreversible operations | migrations, backfills, bulk postings, `git push --force` |

Why these: a PJP in Indonesia operates under **PBI 23/6/PBI/2021** and its
implementing PADG (incl. **PADG 24/7/PADG/2022**, **PADG 32/2025**) for risk
management, cyber-risk governance and incident reporting, and under
**UU PDP 27/2022** for personal data. The compliance team owns the authoritative
mapping — this table is the engineering shorthand, not the regulation.

### Hard rules

- Do **not** edit `backend/src/PaymentLab.Api/appsettings.Production.json`, any
  file under `infra/`, or anything matching `*.secrets.*`. Propose the change in
  the spec instead and say who must approve it.
- Do **not** log, echo in an error, or put into an audit detail: a full PAN, CVV,
  NIK/KTP number, cardholder name, token, or credential. `MaskedPan` is already
  masked — never widen it.
- Do **not** weaken a guard to make a test pass. If a test blocks you, say so.
- Do **not** run `git commit`, `git push`, or change branches unless explicitly asked.
- Do **not** add a NuGet or npm dependency without asking — this repo runs in an
  environment where new packages need approval.

## 5. Conventions

- C#: file-scoped namespaces, `sealed` by default, nullable enabled,
  **warnings are errors** in `PaymentLab.Api`. Constructor injection only.
- Services take `TimeProvider`, never `DateTime.UtcNow` directly, so time can be
  controlled in tests.
- Errors are returned as `RefundResult.Fail(code, message)` with a stable
  SCREAMING_SNAKE code; HTTP mapping lives in the endpoint, not the service.
- Tests: one behaviour per test, named `Method_does_thing`. Table-driven with
  `[Theory]`/`[InlineData]` where the interesting part is the numbers.
- TypeScript: `strict`, no `any`. The server is the authority on amounts;
  client-side validation is a convenience and must mirror a server rule that
  already exists.
- Keep `frontend/src/format.ts` the only place that formats money for display.

## 6. Working agreement with the agent

- Read the change under `openspec/changes/<name>/` first. The spec's
  **acceptance criteria** and **files you may touch** are binding.
- Plan before editing. State which files you will change and why.
- Work in small steps: one acceptance criterion, then run the tests.
- If the spec is ambiguous, ask **one** sharp question rather than guessing.
- When you finish, report: files changed, tests added, acceptance criteria met,
  and anything you deliberately left out.
