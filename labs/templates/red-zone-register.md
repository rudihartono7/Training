# Register red zone & titik henti wajib — <nama tim>

Diisi saat Lab 3, dibawa pulang sebagai dokumen tata kelola versi awal.
Dokumen ini hidup: tinjau tiap kuartal, atau setiap kali ada cacat yang lolos.

> Pemetaan otoritatif ke regulasi dimiliki tim Compliance. Tabel ini adalah
> terjemahan teknisnya untuk engineer, bukan pengganti regulasinya.

---

## 1. Zona

| Kode | Zona | Contoh konkret di repo kami | Kenapa mahal | Approver wajib |
| --- | --- | --- | --- | --- |
| R1 | Logika nominal | `FeeCalculator`, `RefundPolicy`, pembulatan, batas | uang keluar/masuk salah, rekonsiliasi tidak ketemu | |
| R2 | Data sensitif | PAN, CVV, NIK, nama nasabah, token, log | UU PDP 27/2022; kewajiban perlindungan data PJP | |
| R3 | Konfigurasi produksi | `appsettings.Production.json`, flag, ambang, secret | mematikan kontrol tanpa jejak | |
| R4 | Audit & pelaporan | `IAuditLog`, retensi, pelaporan insiden ke BI | tidak ada bukti saat pemeriksaan | |
| R5 | Idempotensi & otorisasi | `Idempotency-Key`, status, dual approval | posting ganda, refund ganda | |
| R6 | Operasi ireversibel | migrasi, backfill, posting massal, force push | tidak bisa dibatalkan | |

Landasan regulasi yang biasa dirujuk PJP di Indonesia: **PBI 23/6/PBI/2021**
beserta PADG pelaksananya (antara lain **PADG 24/7/PADG/2022** dan
**PADG 32/2025**) untuk tata kelola, manajemen risiko TI dan risiko siber,
serta **UU PDP 27/2022** untuk data pribadi.
*Isi kolom "Approver" dengan nama, bukan jabatan.*

## 2. Titik henti wajib sebelum commit

Agent tidak melanjutkan ke commit tanpa persetujuan manusia bernama bila diff:

1. mengubah nilai atau rumus yang menghasilkan nominal
2. menambah atau mengubah apa yang ditulis ke log atau audit trail
3. menyentuh file konfigurasi lingkungan mana pun
4. menyentuh jalur idempotensi, otorisasi, atau retry
5. berisi migrasi, backfill, atau operasi massal
6. **mengubah test yang sudah ada** (bukan menambah) — berapa pun red zone-nya
7. menyentuh file di luar daftar "boleh disentuh" di spec

Tambahan tim kami:

8. ...
9. ...

## 3. Guardrail yang aktif hari ini

| Lapis | Apa yang dipasang | Menangkap | Kelemahan |
| --- | --- | --- | --- |
| Spec | template + angka konkret wajib | ambiguitas sebelum kode ada | hanya kalau spec dibaca |
| Konteks | `CLAUDE.md` bagian 3 & 4 | aturan repo | bisa terkubur di konteks panjang |
| Permission | `deny` di `.claude/settings.json` | edit file terlarang | hanya jalur tool |
| Hook | `.claude/hooks/redzone-guard.sh` | edit konfigurasi produksi & secret | seatbelt, bukan kontrol keamanan |
| Test | assertion pembulatan & idempotensi | regresi yang sudah terpikirkan | tidak menangkap kelalaian |
| CI | ... | ... | ... |
| Manusia | CODEOWNERS + dual approval | red zone | mahal — simpan untuk red zone saja |

**Celah yang kami tahu masih terbuka:**

- ...
- ...

## 4. Tinjauan

| Tanggal | Pemicu tinjauan | Perubahan | Oleh |
| --- | --- | --- | --- |
| | | | |
