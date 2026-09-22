# Template spec eksekutabel

Salin isi file ini ke `openspec/changes/<nama-change>/` dan isi setiap bagian.
Aturannya sederhana: **kalau sebuah kalimat tidak bisa dijadikan test atau
tidak bisa membuat agent berhenti, kalimat itu belum layak masuk spec.**

Enam bagian di bawah ini yang membedakan spec eksekutabel dari tiket Jira.

---

## 1. Konteks repo — apa yang sudah ada

> Agent tidak tahu sejarah repo Anda. Tunjukkan titik masuknya, bukan seluruh peta.

- Kode yang relevan hari ini: `...`
- Abstraksi yang **wajib dipakai ulang** (jangan bikin baru): `...`
- Invariant yang sudah dijaga dan tidak boleh rusak: `...`

## 2. Masalah — satu paragraf, tanpa solusi

> Kalau paragraf ini sudah menyebut nama class atau endpoint, Anda sedang
> menulis desain, bukan masalah.

## 3. Acceptance criteria — Given / When / Then

> Setiap skenario harus bisa dibaca sebagai satu test. Angka konkret, bukan
> "jumlah yang sesuai". Untuk logika nominal, sertakan minimal satu kasus yang
> jatuh di pecahan.

### Skenario: <nama>

- **GIVEN** ...
- **WHEN** ...
- **THEN** ...

### Skenario: <kasus batas>

- **GIVEN** ...
- **WHEN** ...
- **THEN** ...

### Skenario: <kasus gagal / penolakan>

- **GIVEN** ...
- **WHEN** ...
- **THEN** ... dengan kode error `...`

## 4. Batasan — yang tidak boleh dilakukan

- Tidak boleh menambah dependensi baru.
- Tidak boleh mengubah bentuk response yang sudah ada.
- Tidak boleh melemahkan test yang ada supaya hijau.
- Red zone yang tersentuh: R__ (lihat `CLAUDE.md` bagian 4). Kalau tidak ada, tulis "tidak ada".
- Approver yang wajib review sebelum commit: ...

## 5. Out of scope — eksplisit

> Bagian yang paling sering dilewati dan paling sering menyebabkan scope creep.
> Tulis hal-hal yang wajar dikira termasuk, padahal tidak.

- ...
- ...

## 6. File yang boleh & tidak boleh disentuh

**Boleh:**

- `...`

**Tidak boleh:**

- `...`

## 7. Definition of done

- [ ] Semua skenario di bagian 3 punya test yang gagal kalau perilakunya dihapus
- [ ] `./scripts/verify.sh` hijau
- [ ] Tidak ada file di luar daftar "boleh disentuh" yang berubah
- [ ] Agent melaporkan: file berubah, test ditambah, kriteria terpenuhi, dan apa yang sengaja tidak dikerjakan
