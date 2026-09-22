# Metrik tata kelola agent — definisi operasional

**Menit 115–120.** Tiga metrik yang diminta silabus, plus dua yang membuatnya
tidak berbahaya. Definisi di bawah ini sengaja dibuat bisa dihitung dengan
tangan saat lab berjalan — metrik yang butuh tooling tidak akan pernah terisi.

---

## Cara menghitung satu baris

Satu baris = satu task yang dikerjakan satu orang dengan satu spec.

| Kolom | Definisi | Cara hitung |
| --- | --- | --- |
| `spec_questions` | pertanyaan yang masih diajukan agent setelah membaca spec, sebelum menyentuh kode | hitung di Lab 1 langkah 3 |
| `plan_corrections` | berapa kali rencana dikoreksi sebelum eksekusi dimulai | hitung di Lab 2 Ronde A |
| `agent_turns` | giliran agent yang menghasilkan perubahan file atau menjalankan perintah | hitung dari transcript |
| `interventions` | pesan manusia yang **mengoreksi arah**; persetujuan, "lanjut", dan pertanyaan klarifikasi tidak dihitung | hitung sambil jalan |
| `guardrail_blocks` | berapa kali permission atau hook menghentikan agent | dari output hook |
| `tests_green_first_try` | 1 kalau `verify.sh` hijau pada percobaan pertama setelah agent menyatakan selesai, 0 kalau tidak | jalankan sendiri |
| `review_rework_rounds` | berapa putaran perbaikan setelah review manusia | hitung di Lab 3 |
| `escaped_defects` | cacat yang ditemukan **setelah** review dinyatakan lulus | diisi belakangan |
| `wall_clock_min` | menit dari prompt pertama sampai `verify.sh` hijau | jam dinding |

## Tiga metrik utama

**1. Autonomy rate**

```
autonomy_rate = 1 − (interventions ÷ agent_turns)
```

Contoh: 3 intervensi dalam 14 giliran → `1 − 3/14` = **0,79**.

Dibaca sebagai: seberapa jauh agent bisa berjalan sebelum arahnya perlu
dikoreksi. **Ini diagnostik, bukan target.** Lihat peringatan di bawah.

**2. Intervention count**

Angka mentah `interventions`. Yang berguna bukan angkanya, tapi **di mana**
intervensi terjadi. Kelompokkan penyebabnya:

| Penyebab | Artinya | Perbaikannya |
| --- | --- | --- |
| Spec ambigu | spec kurang tajam | perbaiki template spec |
| Konteks repo kurang | agent tidak tahu konvensi | perbaiki `CLAUDE.md` |
| Red zone tersentuh | guardrail bekerja | tidak perlu diperbaiki — ini sukses |
| Agent salah arah sendiri | batas kemampuan | potong task lebih kecil |

Intervensi karena red zone adalah **hasil yang diinginkan**. Jangan dihitung
sebagai kegagalan, dan jangan dipakai untuk menekan autonomy rate.

**3. First-pass correctness**

```
first_pass_correctness = jumlah task dengan review_rework_rounds = 0 ÷ total task
```

Ini metrik yang paling dekat dengan nilai bisnis: berapa persen keluaran agent
lolos review manusia tanpa rework.

## Dua metrik pengaman

Tanpa keduanya, tiga metrik di atas bisa dioptimalkan ke arah yang berbahaya.

**4. Escaped defect rate** — cacat yang lolos review dan baru ketahuan di
staging atau produksi, per 10 task. Ini satu-satunya metrik yang benar-benar
mengukur apakah proses ini aman. Kalau ia naik, semua angka lain tidak relevan.

**5. Red-zone containment** — persentase diff yang menyentuh red zone dan
berhasil dihentikan sebelum commit. Target: 100%. Apa pun di bawah itu adalah
temuan audit, bukan bahan perbaikan bertahap.

## Peringatan: jangan jadikan autonomy rate sebagai KPI

Autonomy rate naik paling cepat dengan **berhenti mengintervensi**. Tim yang
dinilai dari angka ini akan belajar diam, dan angkanya akan terlihat bagus
tepat sampai satu diff yang salah lolos ke produksi.

Pakai berpasangan, selalu:

> **autonomy rate naik + escaped defects tetap nol** → proses membaik.
> **autonomy rate naik + escaped defects naik** → proses memburuk, apa pun kata
> angka pertama.

Untuk kuartal pertama, laporkan **tren**, bukan target. Anda belum punya
baseline, dan target yang dibuat sebelum ada baseline hanya akan dipermainkan.

## Baseline yang wajar untuk 90 hari pertama

| Metrik | Bulan 1 | Bulan 3 | Cara membaca |
| --- | --- | --- | --- |
| Autonomy rate | 0,5–0,7 | 0,7–0,85 | lebih tinggi ≠ lebih baik |
| First-pass correctness | 0,3–0,5 | 0,5–0,7 | ini yang dikejar |
| Escaped defects | 0 | 0 | non-negotiable |
| Red-zone containment | 100% | 100% | non-negotiable |

Angka-angka ini titik awal diskusi, bukan standar industri. Ganti dengan angka
Anda sendiri setelah 20–30 task pertama.
