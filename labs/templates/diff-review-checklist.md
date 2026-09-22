# Checklist review diff agent — domain pembayaran

Dibaca dari atas ke bawah. Urutannya sengaja: **uang dulu, lalu data, lalu
kontrol, baru kualitas kode.** Jangan membaca diff dari baris pertama ke
baris terakhir.

---

## 0. Sebelum membaca satu baris pun

- [ ] Berapa file yang berubah? Lebih dari yang disebut spec → berhenti di sini.
- [ ] Ada file di luar daftar "boleh disentuh"? → blokir, jangan lanjut review.
- [ ] Ada test yang **diubah**, bukan ditambah? (`git diff -- '**/tests/**'`,
      cari baris `-`) → titik henti wajib.

## 1. Konfigurasi (R3)

- [ ] `appsettings*.json`, `infra/**`, workflow CI, Dockerfile — ada yang berubah?
- [ ] Setiap flag yang berubah: kontrol apa yang dimatikannya?
- [ ] Setiap ambang yang naik: siapa yang berwenang menaikkannya?
- [ ] Ada nilai yang mirip secret? (harus dari vault, tidak pernah di file)

## 2. Aritmetika nominal (R1)

- [ ] Ada `double` / `float` menyimpan nominal? → cacat, selalu.
- [ ] Ada `Math.Round` di kode fee? → cacat. Aritmetika fee selalu floor.
- [ ] Setiap perbandingan batas: **dibandingkan terhadap apa?**
      gross / sisa refundable / nol — tulis jawabannya, jangan diasumsikan.
- [ ] Ada perbandingan `.Units` langsung antar `Money`? → penjaga mata uang terlewat.
- [ ] **Hitung satu kasus pecahan dengan tangan.** Tulis angkanya di temuan.
- [ ] Bisakah hasilnya negatif? Bisakah nol? Keduanya harus ditolak eksplisit.

## 3. Idempotensi, otorisasi, retry (R5)

- [ ] Ada kunci yang dibuat sendiri, diberi default, atau dijadikan opsional?
- [ ] Pengecekan replay **sebelum** validasi?
- [ ] Pencarian replay memakai indeks kunci di store, atau memindai satu agregat?
- [ ] Kalau request ini datang dua kali, apakah uang berpindah dua kali?
- [ ] Status transaksi dicek sebelum posting?

## 4. Data sensitif & audit (R2, R4)

- [ ] Ada field baru membawa PAN / CVV / NIK / nama nasabah / token? Cek DTO juga.
- [ ] Ada log baru? Apa isinya, dan ke mana log itu mengalir?
- [ ] Setiap jalur baru yang memindahkan uang menulis audit entry di jalur kode
      yang sama dengan posting-nya?
- [ ] Ada pesan error yang membocorkan data ke pemanggil?

## 5. Apa yang TIDAK ada

> Pertanyaan yang paling sering terlewat. Kelalaian tidak punya baris merah
> untuk ditunjuk, jadi ia lolos kecuali ditanyakan dengan sengaja.

- [ ] Penjaga apa yang ada di jalur lama tapi hilang di jalur baru?
- [ ] Skenario mana di spec yang tidak punya test?
- [ ] Ada kasus batas yang disebut spec tapi tidak muncul di diff?

## 6. Kualitas kode

- [ ] Abstraksi yang sudah ada dipakai ulang, atau dibuat baru tanpa alasan?
- [ ] Perubahan yang tidak diminta? (bukan red zone, tapi tetap scope creep)
- [ ] Nama, struktur, dan gaya konsisten dengan sekitarnya?

---

## Tabel temuan

| # | File:baris | Red zone | Apa yang rusak | Bukti (input → output salah) | Tindakan |
|---|------------|----------|----------------|------------------------------|----------|
| 1 |            |          |                |                              | BLOCK / FIX / NOTE |
| 2 |            |          |                |                              |  |
| 3 |            |          |                |                              |  |
| 4 |            |          |                |                              |  |
| 5 |            |          |                |                              |  |

**Temuan paling mahal:** ...

**Lapis guardrail termurah yang akan menangkapnya:**
spec / konteks / permission / hook / test / CI / manusia → ...

**Terlihat mencurigakan tapi sebenarnya aman:** ...
