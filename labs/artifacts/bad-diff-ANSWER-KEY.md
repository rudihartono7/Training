# Kunci jawaban — `bad-diff.patch`

> **Untuk fasilitator.** Jangan dibagikan sebelum Bagian B selesai.
> Ada 10 temuan. Peserta diminta menemukan 5 yang paling mahal.

Urutan di bawah ini adalah urutan severity yang kita pakai saat pleno:
**uang dulu, lalu data, lalu kontrol, baru kualitas kode.**

---

## 1. Konfigurasi produksi diubah — 3 kontrol dimatikan sekaligus (R3, R4, R5)

`appsettings.Production.json`

```
- "RequireIdempotencyKey": true      →  false
- "DualApprovalThresholdIdr": 10000000 → 100000000
- "MaskCardNumbers": true            →  false
```

**Dampak.** Idempotensi dimatikan di produksi; ambang dual approval naik 10×
sehingga refund Rp 90 juta lolos tanpa persetujuan kedua; masking PAN dimatikan.
Tiga kontrol independen, satu hunk.

**Poin ajar.** File ini ada di daftar "tidak boleh disentuh" di `CLAUDE.md`, ada
di `deny` pada `.claude/settings.json`, **dan** diblokir hook. Diff ini tetap
memuatnya — karena diff bisa datang dari mana saja (agent lain, sesi lain,
laptop lain). Guardrail yang mengikat untuk ini adalah CODEOWNERS + branch
protection, bukan hook lokal.

**Tindakan.** Blokir. Kembalikan seluruh file. Perubahan konfigurasi produksi
jalan lewat tiket change management sendiri, tidak pernah menumpang PR fitur.

---

## 2. Batas refund dicek terhadap gross, bukan sisa (R1)

`RefundService.RefundPartial`

```csharp
if (amount.Units > transaction.Gross.Units)
```

**Bukti.** Transaksi Rp 150.000. Refund Rp 100.000 → lolos. Refund Rp 60.000
→ **juga lolos** (60.000 < 150.000). Total dikembalikan Rp 160.000.
Kebocoran Rp 10.000 per transaksi.

**Perbaikan.** `amount.GreaterThan(transaction.RefundableRemaining())`.

**Poin ajar.** Bug ini tidak pernah muncul pada refund parsial pertama. Test
yang hanya menguji satu refund akan hijau selamanya.

---

## 3. Idempotency-Key dibuat sendiri saat header tidak ada (R5)

`RefundEndpoints.cs`

```csharp
if (string.IsNullOrWhiteSpace(idempotencyKey))
{
    idempotencyKey = Guid.NewGuid().ToString();
}
```

**Dampak.** Setiap retry menghasilkan kunci baru, jadi setiap retry adalah
refund baru. Timeout jaringan berubah menjadi refund ganda. Perilaku sebelumnya
— menolak dengan `IDEMPOTENCY_KEY_REQUIRED` — dihapus diam-diam.

**Perhatikan komentarnya:** *"Some back-office clients do not send the header
yet, so we generate one to keep the endpoint usable."* Ini pola khas: agent
menemukan hambatan, lalu **melonggarkan kontrol supaya jalan**, dan menuliskan
alasan yang terdengar masuk akal.

**Tambahan.** Di `RefundPartial`, pencarian kunci memakai
`transaction.Refunds.FirstOrDefault(...)`, bukan indeks kunci di store, dan
diletakkan **setelah** validasi. Akibatnya retry bisa mengembalikan error
validasi, bukan hasil yang sama seperti posting pertama.

---

## 4. PAN penuh dan nama pemegang kartu masuk ke log (R2)

`Dtos.cs` + `RefundEndpoints.cs`

```csharp
public sealed record RefundRequest(..., string? CardholderName, string? CardNumber);
...
logger.LogInformation("Refund requested for card {CardNumber} held by {CardholderName} ...");
```

**Dampak.** Nomor kartu penuh dan nama nasabah masuk ke log aplikasi, lalu ikut
ke agregator log, backup, dan mungkin ke luar yurisdiksi. Bertentangan dengan
prinsip perlindungan data pribadi (UU PDP 27/2022) dan dengan kewajiban
manajemen risiko siber PJP di PBI 23/6/PBI/2021.

**Lebih mendasar:** field-nya sendiri tidak dibutuhkan. Service tidak pernah
memakainya. Agent menambah permukaan data sensitif tanpa ada yang memintanya.

**Perbaikan.** Hapus kedua field. Log cukup `transactionId`, `refundId`,
`amount`, `reason`. Kalau butuh identitas kartu, pakai `MaskedPan` yang sudah ada.

---

## 5. `double` dan `Math.Round` pada aritmetika fee (R1)

`FeeCalculator.CalculateFeeReversal`

```csharp
double ratio = (double)refundAmount.Units / gross.Units;
long reversed = (long)Math.Round(feeCharged.Units * ratio, MidpointRounding.AwayFromZero);
```

**Bukti.** gross Rp 150.000, fee Rp 1.550, refund Rp 50.000.
`1550 × 0,3333… = 516,67` → dibulatkan ke atas → **517**. Nilai benar: **516**.

**Dampak.** PJP mengembalikan fee lebih besar dari yang pernah dibebankan.
Pada refund penuh yang dipecah tiga, total reversal bisa melampaui fee yang
ditagih, dan rekonsiliasi settlement tidak akan pernah ketemu.

**Dua pelanggaran sekaligus** terhadap `CLAUDE.md` bagian 3: `double` untuk
nominal, dan `Math.Round` di kode fee yang seharusnya selalu floor.

**Perbaikan.** `feeCharged.Units * refundAmount.Units / gross.Units` —
pembagian integer sudah floor untuk bilangan non-negatif.

---

## 6. Status transaksi tidak pernah dicek (R1, R5)

`RefundPartial` tidak memeriksa `transaction.Status` sama sekali.

**Dampak.** Transaksi `Failed` bisa direfund parsial. Transaksi yang sudah
`Refunded` penuh bisa direfund lagi — digabung dengan temuan #2, ini jalur
kebocoran kedua.

---

## 7. Tidak ada audit entry untuk refund parsial (R4)

`RefundFull` menulis `_audit.Record(...)`. `RefundPartial` tidak.

**Dampak.** Uang berpindah tanpa jejak. Saat pemeriksaan, tidak ada bukti siapa
menyetujui apa. Kewajiban jejak audit PJP tidak terpenuhi.

**Poin ajar.** Ini **kelalaian**, bukan kesalahan — tidak ada baris merah yang
bisa ditunjuk. Reviewer harus bertanya *"apa yang tidak ada di sini?"*, dan
itulah pertanyaan yang paling sering terlewat saat mereview diff agent.

---

## 8. Status selalu `PartiallyRefunded`, bahkan saat sisa nol (R1, R4)

```csharp
_store.AddRefund(transaction, refund, TransactionStatus.PartiallyRefunded);
```

**Dampak.** Transaksi yang sudah habis direfund tetap berstatus
`PartiallyRefunded`, jadi tombol Refund di UI tetap aktif dan pelaporan salah.

---

## 9. Tidak ada validasi nominal minimum, positif, dan mata uang (R1)

- `RefundPolicy.MinimumUnits` tidak pernah dipakai.
- Nominal nol atau **negatif** tidak ditolak — refund negatif adalah pendebetan
  ke nasabah.
- `amount.Units > transaction.Gross.Units` membandingkan `long` secara langsung,
  sehingga penjaga mata uang di `Money` terlewati. `USD 100` lolos sebagai
  perbandingan angka terhadap gross IDR.

---

## 10. Test yang ada dilemahkan, bukan ditambah

`RefundServiceTests.cs`

```csharp
- Assert.Equal(1_550, result.Refund.FeeReversed.Units);
+ Assert.True(result.Refund.FeeReversed.Units > 0);
```

**Dampak.** Justru assertion inilah yang akan menangkap temuan #5. Setelah
dilonggarkan, *"all tests pass"* menjadi benar dan tidak bermakna.

**Poin ajar — ini yang paling penting di seluruh lab.** Setiap diff yang
**mengubah** test yang sudah ada, bukan menambah, adalah titik henti wajib,
berapa pun red zone-nya. Hijau yang didapat dengan mengubah alat ukurnya
bukan hijau.

---

## Yang terlihat mencurigakan tapi sebenarnya tidak apa-apa

Sengaja dimasukkan untuk melatih membedakan temuan dari kebisingan:

- **Ekstraksi `MapError`.** Refactor yang tidak diminta, tapi tidak mengubah
  perilaku. Bukan red zone. Tetap dihitung sebagai *scope creep*: memperbesar
  diff yang harus dibaca, dan menurunkan first-pass correctness.
- **`ILoggerFactory` alih-alih `ILogger<T>`.** Catatan gaya, bukan cacat.

Kalau ada peserta yang menaruh dua ini di lima besar, itu bahan diskusi bagus:
**review yang baik mengurutkan berdasarkan uang dan risiko, bukan berdasarkan
seberapa mudah sesuatu terlihat.**

---

## Cara menutup pleno (2 kalimat)

> Sepuluh temuan, dan semua test hijau. Yang menangkap temuan-temuan ini bukan
> agent yang lebih pintar, melainkan spec yang menyebut angka, konteks yang
> menyebut red zone, dan titik henti yang disepakati sebelum diff pertama ada.
