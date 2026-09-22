# PaymentLab — lab repo

Repo latihan untuk workshop **Spec-Driven Agentic Execution: Dari Markdown Spec
ke Merged Diff** (120 menit).

Domain: back office **PJP (Penyedia Jasa Pembayaran)** yang disederhanakan —
transaksi, merchant fee (MDR), refund, jejak audit. Tanpa database, data
in-memory, reset tiap restart.

Stack: **ASP.NET Core 8** (backend, xunit) + **React 18 + Vite + TypeScript**
(frontend, vitest). Agent dijalankan lewat **Claude Code di VS Code**, spec
dikelola dengan **OpenSpec**.

---

## Mulai dari sini

**Peserta:** kerjakan [`labs/LAB-0-setup.md`](labs/LAB-0-setup.md) **sebelum**
hari-H. Setelah itu ikuti lab sesuai urutan sesi.

**Fasilitator:** [`labs/FACILITATOR.md`](labs/FACILITATOR.md).

## Bukti hijau

```bash
./scripts/verify.sh          # Linux / macOS / Git Bash
.\scripts\verify.ps1         # Windows PowerShell
```

Menjalankan `dotnet test` (backend) dan `npm test` + `tsc --noEmit` +
`vite build` (frontend). Inilah definition of done di repo ini.

Kalau `nuget.org` diblokir proxy kantor:

```bash
cd backend/tools/selfcheck && dotnet run
```

Harness tanpa dependensi — 26 pemeriksaan logika domain yang sama.

## Menjalankan aplikasinya

```bash
dotnet run --project backend/src/PaymentLab.Api    # API  → http://localhost:5199
npm --prefix frontend run dev                      # UI   → http://localhost:5173
```

## Isi repo

```
CLAUDE.md                     konteks repo untuk agent — aturan uang, red zone, konvensi
.claude/settings.json         permission: file yang boleh & tidak boleh disentuh
.claude/hooks/                guard red zone sebelum edit
.claude/skills/               contoh skill jadi: money-diff-review
openspec/                     config, dan satu change contoh untuk demo pembuka
backend/                      API + test xunit + harness offline
frontend/                     React + vitest
labs/                         instruksi lab, template, artefak review, golden spec
scripts/verify.sh|.ps1        definition of done
```

## Peta lab

| Menit | Lab | Isi |
| --- | --- | --- |
| — | [LAB 0](labs/LAB-0-setup.md) | Persiapan, dikerjakan sebelum hari-H |
| 00–10 | — | Agent vs asisten + demo `add-merchant-transaction-filter` |
| 10–35 | [LAB 1](labs/LAB-1-executable-spec.md) | Menulis spec eksekutabel |
| 35–75 | [LAB 2](labs/LAB-2-agentic-execution.md) | Strategi eksekusi agentic |
| 75–95 | [LAB 3](labs/LAB-3-review-guardrail.md) | Review diff & guardrail |
| 95–115 | [LAB 4](labs/LAB-4-reusable-asset.md) | Ekstraksi aset reusable |
| 115–120 | [Metrik](labs/templates/metrics-definitions.md) | Tata kelola agent versi awal |

## Catatan

Kode di repo ini sengaja disederhanakan untuk latihan dan **bukan** referensi
implementasi sistem pembayaran produksi. Rujukan regulasi di `CLAUDE.md` dan
`labs/templates/red-zone-register.md` adalah terjemahan teknis untuk engineer;
pemetaan otoritatif ke PBI/PADG/UU PDP dimiliki tim Compliance masing-masing.
