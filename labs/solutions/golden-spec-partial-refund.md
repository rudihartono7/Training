# Golden spec — partial refund dengan fee reversal proporsional

> **Jaring pengaman Lab 1.** Kalau spec Anda belum selesai di menit 35, salin
> isi file ini ke `openspec/changes/add-partial-refund/` dan lanjut ke Lab 2.
> Bandingkan dengan spec Anda sendiri setelah workshop — bagian mana yang
> Anda lewatkan biasanya lebih menarik daripada isinya.

---

## Konteks repo

- `RefundService.RefundFull` hari ini hanya bisa membalik transaksi secara penuh.
- `FeeCalculator` sudah ada dan memegang konvensi: **semua aritmetika fee
  dibulatkan ke bawah (floor)**. Konvensi itu dipakai ulang, bukan ditulis ulang.
- `ITransactionStore.AddRefund(transaction, refund, newStatus)` menambahkan
  refund dan mengubah status dalam satu bagian kritis. Pakai ini; jangan
  mengubah status di luar store.
- `Transaction.RefundableRemaining()` sudah menghitung `Gross − TotalRefunded`.
- `IAuditLog` ditulis di jalur kode yang sama dengan posting.
- Idempotensi diselesaikan di store lewat indeks `IdempotencyKey`, **sebelum**
  validasi apa pun.

## Masalah

Operator back office hanya bisa mengembalikan seluruh nominal transaksi. Ketika
nasabah membatalkan sebagian pesanan, operator terpaksa membatalkan seluruh
transaksi lalu meminta merchant menagih ulang sisanya. Itu menimbulkan dua
posting yang sebenarnya tidak perlu, membuat rekonsiliasi merchant tidak cocok,
dan menahan dana nasabah lebih lama dari seharusnya.

## Aturan nominal

1. `fee_reversal = floor(fee_dibebankan × nominal_refund ÷ gross)`.
   Pembulatan **selalu ke bawah**, tanpa pengecualian.
2. Total fee yang dikembalikan sepanjang umur transaksi tidak pernah melebihi
   fee yang pernah dibebankan.
3. Total nominal yang direfund tidak pernah melebihi `Gross`.
4. Batas per-request dibandingkan terhadap `RefundableRemaining()`,
   **bukan** terhadap `Gross`.
5. Nominal refund harus positif, ≥ `RefundPolicy.MinimumUnits` (Rp 1.000),
   dan bermata uang sama dengan transaksi.

## Acceptance criteria

### Skenario: Refund parsial memposting dan mengembalikan fee proporsional

- **GIVEN** transaksi `trx_1001` berstatus `Settled`, gross Rp 150.000, fee Rp 1.550
- **WHEN** operator merefund Rp 50.000 dengan `Idempotency-Key: k1`
- **THEN** response `200`, `amount.units = 50000`, **`feeReversed.units = 516`**
- **AND** status transaksi menjadi `PartiallyRefunded`
- **AND** `refundableRemaining.units = 100000`

> `floor(1550 × 50000 ÷ 150000) = floor(516,67) = 516`. Bukan 517.

### Skenario: Nominal yang jatuh di pecahan tetap dibulatkan ke bawah

- **GIVEN** transaksi `trx_1002` berstatus `Settled`, gross Rp 99.999, fee Rp 1.199
- **WHEN** operator merefund Rp 33.333
- **THEN** `feeReversed.units = 399`

> `floor(1199 × 33333 ÷ 99999) = floor(399,67) = 399`.

### Skenario: Refund kedua yang melebihi sisa ditolak

- **GIVEN** transaksi gross Rp 150.000 yang sudah direfund Rp 100.000
- **WHEN** operator merefund Rp 60.000
- **THEN** response `400` dengan kode `REFUND_EXCEEDS_REMAINING`
- **AND** tidak ada refund baru yang terposting
- **AND** `refundableRemaining.units` tetap `50000`

### Skenario: Refund yang menghabiskan sisa menandai transaksi Refunded

- **GIVEN** transaksi gross Rp 150.000, fee Rp 1.550, sudah direfund dua kali
  masing-masing Rp 50.000 (fee reversal Rp 516 per refund)
- **WHEN** operator merefund Rp 50.000 yang ketiga
- **THEN** `feeReversed.units = 516`
- **AND** status menjadi `Refunded`
- **AND** `refundableRemaining` nol
- **AND** total fee dikembalikan Rp 1.548, **tidak pernah melebihi** Rp 1.550

> Inilah gunanya floor. Tiga pembulatan ke bawah berjumlah Rp 1.548 ≤ Rp 1.550.
> Dengan pembulatan setengah ke atas, `516,67` menjadi `517` tiga kali dan
> totalnya Rp 1.551 — PJP mengembalikan fee **lebih besar** dari yang pernah
> ditagih, dan rekonsiliasi settlement tidak akan pernah ketemu.

### Skenario: Nominal di bawah minimum ditolak

- **GIVEN** transaksi `Settled`
- **WHEN** operator merefund Rp 999
- **THEN** response `400` dengan kode `REFUND_BELOW_MINIMUM`

### Skenario: Nominal nol atau negatif ditolak

- **GIVEN** transaksi `Settled`
- **WHEN** operator merefund Rp 0 atau Rp −50.000
- **THEN** response `400` dengan kode `REFUND_AMOUNT_INVALID`
- **AND** tidak ada posting apa pun

### Skenario: Mata uang berbeda ditolak

- **GIVEN** transaksi bermata uang `IDR`
- **WHEN** request membawa nominal bermata uang `USD`
- **THEN** response `400` dengan kode `CURRENCY_MISMATCH`

### Skenario: Request yang diulang mengembalikan posting yang sama

- **GIVEN** refund Rp 50.000 sudah terposting dengan `Idempotency-Key: k1`
- **WHEN** request identik dikirim ulang dengan `Idempotency-Key: k1`
- **THEN** response `200` dengan `refundId` yang **sama**
- **AND** jumlah refund pada transaksi tetap satu
- **AND** `refundableRemaining` tidak berubah

### Skenario: Tanpa Idempotency-Key ditolak

- **WHEN** request dikirim tanpa header `Idempotency-Key`
- **THEN** response `400` dengan kode `IDEMPOTENCY_KEY_REQUIRED`
- **AND** tidak ada posting apa pun

> Kunci **tidak boleh** dibuatkan oleh server. Retry harus mengembalikan hasil
> yang sama, bukan posting baru.

### Skenario: Transaksi yang tidak layak refund ditolak

- **GIVEN** transaksi berstatus `Failed` atau `Refunded`
- **WHEN** operator merefund berapa pun
- **THEN** response `409` dengan kode `TRANSACTION_NOT_REFUNDABLE`

> `PartiallyRefunded` **layak** direfund lagi selama masih ada sisa.

### Skenario: Di luar jendela refund ditolak

- **GIVEN** transaksi yang diotorisasi 120 hari lalu
- **WHEN** operator merefund berapa pun
- **THEN** response `400` dengan kode `REFUND_WINDOW_EXPIRED`

### Skenario: Refund parsial meninggalkan jejak audit

- **WHEN** refund parsial berhasil terposting
- **THEN** ada satu entry `IAuditLog` dengan action `refund.partial.posted`
- **AND** entry berisi `refundId`, `merchantId`, `amount`, `feeReversed`,
  `reason`, `idempotencyKey`
- **AND** entry **tidak** berisi nomor kartu, nama pemegang kartu, atau kredensial

## Urutan pengecekan (mengikat)

1. `Idempotency-Key` ada → kalau tidak, `IDEMPOTENCY_KEY_REQUIRED`
2. Cari posting dengan kunci yang sama → kalau ada, kembalikan posting itu
3. Nominal valid (positif, ≥ minimum, mata uang sama)
4. Alasan ada
5. Transaksi ada
6. Status layak refund
7. Jendela refund
8. Nominal ≤ `RefundableRemaining()`
9. Posting + status + audit

## Out of scope

- Perubahan UI. `RefundDialog` tetap hanya mengirim refund penuh; nominal yang
  bisa diedit adalah pekerjaan terpisah.
- Pembatalan refund yang sudah terposting.
- Dual approval untuk nominal besar (ambangnya sudah ada di konfigurasi, tapi
  penegakannya bukan bagian change ini).
- Persistensi. Store tetap in-memory.
- Penyesuaian jadwal settlement.

## File yang boleh disentuh

- `backend/src/PaymentLab.Api/Services/RefundService.cs`
- `backend/src/PaymentLab.Api/Services/FeeCalculator.cs` (**hanya menambah**
  method reversal; konvensi floor yang ada tidak boleh diubah)
- `backend/src/PaymentLab.Api/Endpoints/RefundEndpoints.cs`
- `backend/src/PaymentLab.Api/Endpoints/Dtos.cs`
- `backend/tests/PaymentLab.Api.Tests/**`

## File yang TIDAK boleh disentuh

- `backend/src/PaymentLab.Api/Domain/Money.cs`
- `backend/src/PaymentLab.Api/Domain/RefundPolicy.cs`
- `backend/src/PaymentLab.Api/appsettings*.json`
- `frontend/**`
- `.claude/**`

## Red zone

- **R1** logika nominal — pembulatan fee dan batas refund
- **R4** jejak audit — jalur posting baru
- **R5** idempotensi — jalur posting baru

**Approver wajib sebelum commit:** tech lead + satu reviewer dari tim Payment
Operations. Tidak perlu sign-off Compliance selama konfigurasi tidak berubah.

## Definition of done

- [ ] Semua skenario punya test yang gagal bila perilakunya dihapus
- [ ] Test tabel `[Theory]` mencakup minimal tiga kasus pecahan
- [ ] `./scripts/verify.sh` hijau
- [ ] Tidak ada file di luar daftar "boleh disentuh" yang berubah
- [ ] **Tidak ada test lama yang diubah** — hanya penambahan
- [ ] Agent melaporkan: file berubah, test ditambah, kriteria terpenuhi, dan apa
      yang sengaja tidak dikerjakan
